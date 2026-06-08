const db = require('../config/database');
const config = require('../config');
const { AppError, generateOrderNumber, paginate, paginatedResponse } = require('../utils/helpers');
const { notifyDealer, notifyAdmins } = require('./notification.service');

let razorpay = null;
if (config.razorpay.keyId && config.razorpay.keySecret) {
  const Razorpay = require('razorpay');
  razorpay = new Razorpay({ key_id: config.razorpay.keyId, key_secret: config.razorpay.keySecret });
}

const getOrderPaymentTotals = async (orderId) => {
  const [rows] = await db.query(
    `SELECT COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) AS paid_amount,
            COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) AS pending_amount
     FROM payments WHERE order_id = ?`,
    [orderId]
  );
  return {
    paidAmount: Number(rows[0].paid_amount),
    pendingAmount: Number(rows[0].pending_amount),
  };
};

const buildPaymentStatus = (totalAmount, paidAmount) => {
  if (paidAmount >= totalAmount) return 'paid';
  if (paidAmount > 0) return 'partial';
  return 'pending';
};

const listOrderSummaries = async (filters = {}, user = null) => {
  let where = "WHERE o.order_type = 'dealer' AND o.status != 'cancelled'";
  const params = [];

  if (user?.role_slug === 'dealer' && user.dealer) {
    where += ' AND o.dealer_id = ?';
    params.push(user.dealer.id);
  }
  if (filters.dealerId) {
    where += ' AND o.dealer_id = ?';
    params.push(filters.dealerId);
  }

  let having = '';
  if (filters.paymentStatus === 'paid') {
    having = ' HAVING paid_amount >= o.total_amount';
  } else if (filters.paymentStatus === 'partial') {
    having = ' HAVING paid_amount > 0 AND paid_amount < o.total_amount';
  } else if (filters.paymentStatus === 'pending') {
    having = ' HAVING paid_amount = 0';
  }

  const [rows] = await db.query(
    `SELECT o.id, o.order_number, o.dealer_id, o.total_amount, o.status AS order_status,
            o.created_at, d.business_name AS dealer_name, d.dealer_code,
            COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) AS paid_amount,
            COALESCE(SUM(CASE WHEN p.status = 'pending' THEN p.amount ELSE 0 END), 0) AS pending_amount,
            COUNT(p.id) AS payment_count
     FROM orders o
     LEFT JOIN dealers d ON o.dealer_id = d.id
     LEFT JOIN payments p ON p.order_id = o.id
     ${where}
     GROUP BY o.id
     ${having}
     ORDER BY o.created_at DESC`,
    params
  );

  return rows.map((r) => {
    const totalAmount = Number(r.total_amount);
    const paidAmount = Number(r.paid_amount);
    const pendingAmount = Number(r.pending_amount);
    const remainingAmount = Math.max(0, totalAmount - paidAmount - pendingAmount);
    return {
      ...r,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      pending_amount: pendingAmount,
      remaining_amount: remainingAmount,
      payment_status: buildPaymentStatus(totalAmount, paidAmount),
    };
  });
};

const getTotalsSummary = async (user = null) => {
  const orders = await listOrderSummaries({}, user);
  const totals = orders.reduce(
    (acc, o) => {
      acc.orderTotal += o.total_amount;
      acc.paidTotal += o.paid_amount;
      acc.remainingTotal += o.remaining_amount;
      acc.orderCount += 1;
      if (o.payment_status === 'paid') acc.paidCount += 1;
      else if (o.payment_status === 'partial') acc.partialCount += 1;
      else acc.pendingCount += 1;
      return acc;
    },
    { orderCount: 0, paidCount: 0, partialCount: 0, pendingCount: 0, orderTotal: 0, paidTotal: 0, remainingTotal: 0 }
  );
  return totals;
};

const list = async (filters = {}, user = null) => {
  const { page, limit, offset } = paginate(filters.page, filters.limit);
  let where = 'WHERE 1=1';
  const params = [];
  if (user?.role_slug === 'dealer' && user.dealer) {
    where += ' AND p.dealer_id = ?';
    params.push(user.dealer.id);
  }
  if (filters.status) {
    where += ' AND p.status = ?';
    params.push(filters.status);
  }
  if (filters.orderId) {
    where += ' AND p.order_id = ?';
    params.push(filters.orderId);
  }

  const [count] = await db.query(`SELECT COUNT(*) AS total FROM payments p ${where}`, params);
  const [rows] = await db.query(
    `SELECT p.*, d.business_name AS dealer_name, o.order_number
     FROM payments p JOIN dealers d ON p.dealer_id = d.id LEFT JOIN orders o ON p.order_id = o.id
     ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return paginatedResponse(rows, count[0].total, page, limit);
};

const createPayment = async (data, user) => {
  if (!data.orderId) throw new AppError('Order is required', 400);
  if (!data.amount || Number(data.amount) <= 0) throw new AppError('Valid payment amount is required', 400);
  if (!data.paymentMethod) throw new AppError('Payment method is required', 400);

  const [orders] = await db.query(
    `SELECT o.* FROM orders o WHERE o.id = ? AND o.order_type = 'dealer' AND o.status != 'cancelled'`,
    [data.orderId]
  );
  if (!orders.length) throw new AppError('Order not found', 404);

  const order = orders[0];
  if (user.role_slug === 'dealer') {
    if (!user.dealer || order.dealer_id !== user.dealer.id) {
      throw new AppError('You can only pay for your own orders', 403);
    }
  }

  const { paidAmount, pendingAmount } = await getOrderPaymentTotals(data.orderId);
  const totalAmount = Number(order.total_amount);
  const remaining = totalAmount - paidAmount - pendingAmount;
  const amount = Number(data.amount);

  if (amount > remaining + 0.01) {
    throw new AppError(`Amount exceeds remaining balance of ₹${remaining.toFixed(2)}`, 400);
  }

  const paymentType = amount >= remaining - 0.01 ? 'full' : 'partial';
  const dealerId = order.dealer_id;
  const paymentNumber = generateOrderNumber('PAY');

  const [result] = await db.query(
    `INSERT INTO payments (payment_number, order_id, dealer_id, amount, payment_type, payment_method, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
    [paymentNumber, data.orderId, dealerId, amount, paymentType, data.paymentMethod, data.notes || null]
  );

  if (data.paymentMethod === 'razorpay' && razorpay) {
    const rzpOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: paymentNumber,
    });
    await db.query('UPDATE payments SET razorpay_order_id = ? WHERE id = ?', [rzpOrder.id, result.insertId]);
    return {
      paymentId: result.insertId,
      paymentNumber,
      razorpayOrderId: rzpOrder.id,
      amount,
      razorpayKeyId: config.razorpay.keyId,
    };
  }

  if (['cash', 'upi', 'bank_transfer', 'cheque'].includes(data.paymentMethod)) {
    await db.query(
      "UPDATE payments SET status = 'completed', paid_at = NOW(), transaction_ref = ? WHERE id = ?",
      [data.transactionRef || paymentNumber, result.insertId]
    );
    await notifyAdmins({
      title: 'Payment Received',
      message: `Payment ${paymentNumber} of ₹${amount} for order ${order.order_number}`,
      type: 'payment_received',
      channels: ['in_app'],
    });
    if (dealerId) {
      await notifyDealer(dealerId, {
        title: 'Payment Recorded',
        message: `Payment ${paymentNumber} of ₹${amount} recorded for order ${order.order_number}`,
        type: 'payment_received',
      });
    }
  }

  return { paymentId: result.insertId, paymentNumber, amount, status: 'completed' };
};

const verifyRazorpay = async ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  const crypto = require('crypto');
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected = crypto.createHmac('sha256', config.razorpay.keySecret).update(body).digest('hex');

  if (expected !== razorpaySignature) throw new AppError('Invalid payment signature', 400);

  await db.query(
    `UPDATE payments SET status = 'completed', razorpay_payment_id = ?, razorpay_signature = ?, paid_at = NOW()
     WHERE razorpay_order_id = ?`,
    [razorpayPaymentId, razorpaySignature, razorpayOrderId]
  );

  const [payments] = await db.query('SELECT * FROM payments WHERE razorpay_order_id = ?', [razorpayOrderId]);
  if (payments[0]) {
    await notifyDealer(payments[0].dealer_id, {
      title: 'Payment Confirmed',
      message: `Payment of ₹${payments[0].amount} confirmed`,
      type: 'payment_received',
    });
  }
  return { success: true };
};

const createInvoice = async (data, userId) => {
  const invoiceNumber = generateOrderNumber('INV');
  const [result] = await db.query(
    `INSERT INTO invoices (invoice_number, order_id, payment_id, dealer_id, subtotal, tax_amount, discount_amount, total_amount, status, issued_at, due_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'issued', NOW(), ?)`,
    [invoiceNumber, data.orderId, data.paymentId, data.dealerId, data.subtotal, data.taxAmount || 0,
      data.discountAmount || 0, data.totalAmount, data.dueDate]
  );
  return { id: result.insertId, invoiceNumber };
};

const createRefund = async (paymentId, data, userId) => {
  const [payments] = await db.query('SELECT * FROM payments WHERE id = ? AND status = "completed"', [paymentId]);
  if (!payments.length) throw new AppError('Payment not found or not eligible for refund', 400);

  const refundNumber = generateOrderNumber('REF');
  const [result] = await db.query(
    'INSERT INTO refunds (refund_number, payment_id, amount, reason, created_by) VALUES (?,?,?,?,?)',
    [refundNumber, paymentId, data.amount, data.reason, userId]
  );
  return { id: result.insertId, refundNumber };
};

module.exports = {
  list,
  listOrderSummaries,
  getTotalsSummary,
  createPayment,
  verifyRazorpay,
  createInvoice,
  createRefund,
};
