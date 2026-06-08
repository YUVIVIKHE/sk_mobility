const db = require('../config/database');
const { AppError, paginate, paginatedResponse } = require('../utils/helpers');
const { notifyAdmins } = require('./notification.service');

const listWarehouses = async () => {
  const [rows] = await db.query('SELECT * FROM warehouses WHERE is_active = 1');
  return rows;
};

const listInventory = async (filters = {}) => {
  const { page, limit, offset } = paginate(filters.page, filters.limit);
  let where = 'WHERE 1=1';
  const params = [];
  if (filters.warehouseId) { where += ' AND i.warehouse_id = ?'; params.push(filters.warehouseId); }
  if (filters.lowStock) { where += ' AND i.quantity <= i.low_stock_threshold'; }

  const [count] = await db.query(`SELECT COUNT(*) AS total FROM inventory i ${where}`, params);
  const [rows] = await db.query(
    `SELECT i.*, w.name AS warehouse_name, vv.name AS variant_name, vv.sku, v.name AS vehicle_name,
            CASE WHEN i.quantity <= i.low_stock_threshold THEN 1 ELSE 0 END AS is_low_stock
     FROM inventory i JOIN warehouses w ON i.warehouse_id = w.id
     JOIN vehicle_variants vv ON i.variant_id = vv.id JOIN vehicles v ON vv.vehicle_id = v.id
     ${where} ORDER BY is_low_stock DESC, i.quantity ASC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return paginatedResponse(rows, count[0].total, page, limit);
};

const adjustStock = async (data, userId) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [inv] = await conn.query(
      'SELECT * FROM inventory WHERE warehouse_id = ? AND variant_id = ? FOR UPDATE',
      [data.warehouseId, data.variantId]
    );

    let inventoryId;
    if (!inv.length) {
      const [result] = await conn.query(
        'INSERT INTO inventory (warehouse_id, variant_id, quantity) VALUES (?, ?, ?)',
        [data.warehouseId, data.variantId, Math.max(0, data.quantity)]
      );
      inventoryId = result.insertId;
    } else {
      inventoryId = inv[0].id;
      const newQty = data.movementType === 'out' ? inv[0].quantity - data.quantity : inv[0].quantity + data.quantity;
      if (newQty < 0) throw new AppError('Insufficient stock', 400);
      await conn.query('UPDATE inventory SET quantity = ? WHERE id = ?', [newQty, inventoryId]);
    }

    await conn.query(
      `INSERT INTO stock_movements (inventory_id, movement_type, quantity, from_warehouse_id, to_warehouse_id,
       dealer_id, notes, created_by) VALUES (?,?,?,?,?,?,?,?)`,
      [inventoryId, data.movementType, data.quantity, data.fromWarehouseId, data.toWarehouseId,
       data.dealerId, data.notes, userId]
    );

    await conn.commit();

    const [updated] = await db.query('SELECT * FROM inventory WHERE id = ?', [inventoryId]);
    if (updated[0]?.quantity <= updated[0]?.low_stock_threshold) {
      await notifyAdmins({
        title: 'Low Stock Alert',
        message: `Variant ID ${data.variantId} is low on stock (${updated[0].quantity} remaining)`,
        type: 'low_stock',
        channels: ['in_app', 'email'],
      });
    }

    return updated[0];
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const transferStock = async (data, userId) => {
  await adjustStock({ warehouseId: data.fromWarehouseId, variantId: data.variantId, quantity: data.quantity, movementType: 'out', notes: 'Transfer out' }, userId);
  return adjustStock({ warehouseId: data.toWarehouseId, variantId: data.variantId, quantity: data.quantity, movementType: 'in', fromWarehouseId: data.fromWarehouseId, toWarehouseId: data.toWarehouseId, notes: 'Transfer in' }, userId);
};

module.exports = { listWarehouses, listInventory, adjustStock, transferStock };
