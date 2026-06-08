const db = require('../config/database');
const { AppError, generateOrderNumber, paginate, paginatedResponse } = require('../utils/helpers');
const { notifyDealer, notifyAdmins } = require('./notification.service');

const list = async (filters = {}, user = null) => {
  const { page, limit, offset } = paginate(filters.page, filters.limit);
  let where = 'WHERE 1=1';
  const params = [];
  if (user?.role_slug === 'dealer' && user.dealer) { where += ' AND l.dealer_id = ?'; params.push(user.dealer.id); }
  if (filters.status) { where += ' AND l.status = ?'; params.push(filters.status); }
  if (filters.sourceId) { where += ' AND l.source_id = ?'; params.push(filters.sourceId); }

  const [count] = await db.query(`SELECT COUNT(*) AS total FROM leads l ${where}`, params);
  const [rows] = await db.query(
    `SELECT l.*, ls.name AS source_name, d.business_name AS dealer_name, v.name AS vehicle_interest
     FROM leads l LEFT JOIN lead_sources ls ON l.source_id = ls.id
     LEFT JOIN dealers d ON l.dealer_id = d.id LEFT JOIN vehicles v ON l.vehicle_interest_id = v.id
     ${where} ORDER BY l.created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return paginatedResponse(rows, count[0].total, page, limit);
};

const create = async (data) => {
  const leadNumber = generateOrderNumber('LD');
  const [result] = await db.query(
    `INSERT INTO leads (lead_number, source_id, dealer_id, customer_name, customer_email, customer_phone,
     vehicle_interest_id, status, notes, qr_code_id) VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [leadNumber, data.sourceId, data.dealerId, data.customerName, data.customerEmail, data.customerPhone,
     data.vehicleInterestId, 'new', data.notes, data.qrCodeId]
  );

  if (data.dealerId) {
    await notifyDealer(data.dealerId, { title: 'New Lead', message: `Lead ${leadNumber} from ${data.customerName}`, type: 'new_lead', channels: ['in_app'] });
  } else {
    await notifyAdmins({ title: 'New Lead', message: `Lead ${leadNumber} captured`, type: 'new_lead', channels: ['in_app'] });
  }

  return { id: result.insertId, leadNumber };
};

const updateStatus = async (id, { status, notes }, userId) => {
  const [leads] = await db.query('SELECT status FROM leads WHERE id = ?', [id]);
  if (!leads.length) throw new AppError('Lead not found', 404);

  await db.query('UPDATE leads SET status = ? WHERE id = ?', [status, id]);
  await db.query(
    'INSERT INTO lead_followups (lead_id, followup_type, notes, status_before, status_after, created_by) VALUES (?,?,?,?,?,?)',
    [id, 'other', notes || `Status updated to ${status}`, leads[0].status, status, userId]
  );
  return { id, status };
};

const addFollowup = async (leadId, data, userId) => {
  await db.query(
    'INSERT INTO lead_followups (lead_id, followup_type, notes, next_followup_date, created_by) VALUES (?,?,?,?,?)',
    [leadId, data.followupType, data.notes, data.nextFollowupDate, userId]
  );
  if (data.status) await updateStatus(leadId, { status: data.status, notes: data.notes }, userId);
};

const getAnalytics = async (dealerId = null) => {
  let where = '';
  const params = [];
  if (dealerId) { where = 'WHERE dealer_id = ?'; params.push(dealerId); }

  const [byStatus] = await db.query(`SELECT status, COUNT(*) AS count FROM leads ${where} GROUP BY status`, params);
  const [bySource] = await db.query(
    `SELECT ls.name, COUNT(l.id) AS count FROM leads l JOIN lead_sources ls ON l.source_id = ls.id ${where.replace('dealer_id', 'l.dealer_id')} GROUP BY ls.id`, params
  );
  return { byStatus, bySource };
};

const listSources = async () => {
  const [rows] = await db.query('SELECT * FROM lead_sources WHERE is_active = 1');
  return rows;
};

module.exports = { list, create, updateStatus, addFollowup, getAnalytics, listSources };
