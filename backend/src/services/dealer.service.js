const db = require('../config/database');
const { hashPassword } = require('../utils/jwt');
const { AppError, generateOrderNumber, paginate, paginatedResponse } = require('../utils/helpers');
const { createAuditLog } = require('../utils/audit');
const { notifyAdmins } = require('./notification.service');

const generateDealerCode = () => `DLR-${Date.now().toString(36).toUpperCase()}`;

const list = async (filters = {}) => {
  const { page, limit, offset } = paginate(filters.page, filters.limit);
  let where = 'WHERE 1=1';
  const params = [];

  if (filters.status) { where += ' AND d.status = ?'; params.push(filters.status); }
  if (filters.search) {
    where += ' AND (d.business_name LIKE ? OR d.dealer_code LIKE ? OR d.email LIKE ?)';
    const s = `%${filters.search}%`;
    params.push(s, s, s);
  }

  const [count] = await db.query(`SELECT COUNT(*) AS total FROM dealers d ${where}`, params);
  const [rows] = await db.query(
    `SELECT d.*, u.email AS user_email FROM dealers d LEFT JOIN users u ON d.user_id = u.id
     ${where} ORDER BY d.created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return paginatedResponse(rows, count[0].total, page, limit);
};

const getById = async (id) => {
  const [dealers] = await db.query('SELECT * FROM dealers WHERE id = ?', [id]);
  if (!dealers.length) throw new AppError('Dealer not found', 404);

  const [addresses] = await db.query('SELECT * FROM dealer_addresses WHERE dealer_id = ?', [id]);
  const [documents] = await db.query('SELECT * FROM dealer_documents WHERE dealer_id = ?', [id]);
  const [activities] = await db.query(
    'SELECT * FROM dealer_activities WHERE dealer_id = ? ORDER BY created_at DESC LIMIT 50', [id]
  );

  return { ...dealers[0], addresses, documents, activities };
};

const register = async (data, req) => {
  const dealerCode = generateDealerCode();
  const [result] = await db.query(
    `INSERT INTO dealers (dealer_code, business_name, contact_person, email, phone, gst_number, pan_number, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [dealerCode, data.businessName, data.contactPerson, data.email, data.phone, data.gstNumber, data.panNumber]
  );

  if (data.address) {
    await db.query(
      `INSERT INTO dealer_addresses (dealer_id, address_type, address_line1, address_line2, city, state, pincode, is_primary)
       VALUES (?, 'office', ?, ?, ?, ?, ?, 1)`,
      [result.insertId, data.address.line1, data.address.line2, data.address.city, data.address.state, data.address.pincode]
    );
  }

  await db.query(
    'INSERT INTO dealer_activities (dealer_id, activity_type, description) VALUES (?, ?, ?)',
    [result.insertId, 'registration', 'Dealer registration submitted']
  );

  await notifyAdmins({
    title: 'New Dealer Registration',
    message: `${data.businessName} (${dealerCode}) has registered and awaits approval.`,
    type: 'dealer_registration',
    channels: ['in_app', 'email'],
  });

  await createAuditLog({ action: 'create', module: 'dealers', entityType: 'dealer', entityId: result.insertId, newValues: data, req });
  return { id: result.insertId, dealerCode };
};

const linkDealerUser = async (dealer) => {
  const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ?', [dealer.email]);
  if (existingUsers.length) {
    await db.query('UPDATE dealers SET user_id = ? WHERE id = ?', [existingUsers[0].id, dealer.id]);
    return existingUsers[0].id;
  }

  const [roles] = await db.query("SELECT id FROM roles WHERE slug = 'dealer'");
  const passwordHash = await hashPassword('Dealer@123');
  const nameParts = (dealer.contact_person || 'Dealer User').trim().split(' ');
  const [userResult] = await db.query(
    `INSERT INTO users (role_id, email, password_hash, first_name, last_name, phone, is_active, is_verified, email_verified_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, 1, NOW())`,
    [roles[0].id, dealer.email, passwordHash, nameParts[0], nameParts.slice(1).join(' ') || '', dealer.phone]
  );
  await db.query('UPDATE dealers SET user_id = ? WHERE id = ?', [userResult.insertId, dealer.id]);
  return userResult.insertId;
};

const create = async (data, userId, req) => {
  const [existing] = await db.query('SELECT id FROM dealers WHERE email = ?', [data.email]);
  if (existing.length) throw new AppError('A dealer with this email already exists', 409);

  const dealerCode = data.dealerCode?.trim() || generateDealerCode();
  const [result] = await db.query(
    `INSERT INTO dealers (dealer_code, business_name, contact_person, email, phone, gst_number, pan_number, status, approved_by, approved_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', ?, NOW())`,
    [dealerCode, data.businessName, data.contactPerson, data.email, data.phone, data.gstNumber || null, data.panNumber || null, userId]
  );

  const dealerId = result.insertId;
  if (data.address?.line1) {
    await db.query(
      `INSERT INTO dealer_addresses (dealer_id, address_type, address_line1, address_line2, city, state, pincode, is_primary)
       VALUES (?, 'office', ?, ?, ?, ?, ?, 1)`,
      [dealerId, data.address.line1, data.address.line2 || null, data.address.city, data.address.state, data.address.pincode]
    );
  }

  const dealer = { id: dealerId, email: data.email, contact_person: data.contactPerson, phone: data.phone };
  await linkDealerUser(dealer);

  await db.query(
    'INSERT INTO dealer_activities (dealer_id, activity_type, description, created_by) VALUES (?, ?, ?, ?)',
    [dealerId, 'created', 'Dealer created by admin with login account', userId]
  );

  await createAuditLog({ userId, action: 'create', module: 'dealers', entityType: 'dealer', entityId: dealerId, newValues: data, req });
  return { ...await getById(dealerId), defaultPassword: 'Dealer@123' };
};

const approve = async (id, { status, notes }, userId, req) => {
  const dealer = await getById(id);
  if (!['approved', 'rejected', 'suspended'].includes(status)) {
    throw new AppError('Invalid status', 400);
  }

  await db.query(
    'UPDATE dealers SET status = ?, approval_notes = ?, approved_by = ?, approved_at = NOW() WHERE id = ?',
    [status, notes, userId, id]
  );

  if (status === 'approved' && !dealer.user_id) {
    await linkDealerUser(dealer);
  }

  await db.query(
    'INSERT INTO dealer_activities (dealer_id, activity_type, description, created_by) VALUES (?, ?, ?, ?)',
    [id, 'status_change', `Status changed to ${status}${notes ? ': ' + notes : ''}`, userId]
  );

  await createAuditLog({ userId, action: 'approve', module: 'dealers', entityType: 'dealer', entityId: id, newValues: { status, notes }, req });
  const updated = await getById(id);
  return status === 'approved' && !dealer.user_id ? { ...updated, defaultPassword: 'Dealer@123' } : updated;
};

const addDocument = async (dealerId, file, documentType, req) => {
  const [result] = await db.query(
    `INSERT INTO dealer_documents (dealer_id, document_type, document_name, file_path, file_size)
     VALUES (?, ?, ?, ?, ?)`,
    [dealerId, documentType, file.originalname, file.path.replace(/\\/g, '/'), file.size]
  );
  return { id: result.insertId, filePath: file.path };
};

const getPerformance = async (dealerId) => {
  const [stats] = await db.query(
    `SELECT COUNT(DISTINCT o.id) AS total_orders,
            COALESCE(SUM(o.total_amount), 0) AS total_revenue,
            COUNT(DISTINCT l.id) AS total_leads,
            SUM(CASE WHEN l.status = 'converted' THEN 1 ELSE 0 END) AS converted_leads
     FROM dealers d
     LEFT JOIN orders o ON o.dealer_id = d.id AND o.status != 'cancelled'
     LEFT JOIN leads l ON l.dealer_id = d.id
     WHERE d.id = ?`,
    [dealerId]
  );
  return stats[0];
};

module.exports = { list, getById, register, create, approve, addDocument, getPerformance };
