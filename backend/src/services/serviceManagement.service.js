const db = require('../config/database');
const { AppError, generateOrderNumber, paginate, paginatedResponse } = require('../utils/helpers');
const { notifyAdmins } = require('./notification.service');

const listRequests = async (filters = {}, user = null) => {
  const { page, limit, offset } = paginate(filters.page, filters.limit);
  let where = 'WHERE 1=1';
  const params = [];
  if (user?.role_slug === 'dealer' && user.dealer) { where += ' AND sr.dealer_id = ?'; params.push(user.dealer.id); }
  if (filters.status) { where += ' AND sr.status = ?'; params.push(filters.status); }

  const [count] = await db.query(`SELECT COUNT(*) AS total FROM service_requests sr ${where}`, params);
  const [rows] = await db.query(
    `SELECT sr.*, d.business_name AS dealer_name, v.name AS vehicle_name
     FROM service_requests sr LEFT JOIN dealers d ON sr.dealer_id = d.id
     LEFT JOIN vehicles v ON sr.vehicle_id = v.id ${where}
     ORDER BY sr.created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return paginatedResponse(rows, count[0].total, page, limit);
};

const createRequest = async (data) => {
  const requestNumber = generateOrderNumber('SRV');
  const [result] = await db.query(
    `INSERT INTO service_requests (request_number, dealer_id, customer_name, customer_phone, customer_email,
     vehicle_id, variant_id, vin_number, service_type, scheduled_date, description, warranty_expiry, amc_expiry)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [requestNumber, data.dealerId, data.customerName, data.customerPhone, data.customerEmail,
     data.vehicleId, data.variantId, data.vinNumber, data.serviceType, data.scheduledDate,
     data.description, data.warrantyExpiry, data.amcExpiry]
  );
  return { id: result.insertId, requestNumber };
};

const createJobCard = async (serviceRequestId, data, userId) => {
  const jobNumber = generateOrderNumber('JOB');
  const [result] = await db.query(
    `INSERT INTO job_cards (job_number, service_request_id, technician_id, diagnosis, status)
     VALUES (?, ?, ?, ?, 'open')`,
    [jobNumber, serviceRequestId, data.technicianId, data.diagnosis]
  );
  await db.query("UPDATE service_requests SET status = 'in_progress' WHERE id = ?", [serviceRequestId]);
  return { id: result.insertId, jobNumber };
};

const updateJobCard = async (id, data) => {
  const fields = [];
  const params = [];
  ['status', 'diagnosis', 'work_done', 'labour_charges', 'parts_charges', 'technician_id'].forEach((key) => {
    if (data[key] !== undefined) { fields.push(`${key} = ?`); params.push(data[key]); }
  });
  if (data.labour_charges !== undefined || data.parts_charges !== undefined) {
    const labour = data.labour_charges || 0;
    const parts = data.parts_charges || 0;
    fields.push('total_charges = ?');
    params.push(labour + parts);
  }
  if (data.status === 'completed') fields.push('completed_at = NOW()');
  if (!fields.length) throw new AppError('No fields to update', 400);

  params.push(id);
  await db.query(`UPDATE job_cards SET ${fields.join(', ')} WHERE id = ?`, params);

  if (data.status === 'completed') {
    const [jobs] = await db.query('SELECT service_request_id FROM job_cards WHERE id = ?', [id]);
    await db.query("UPDATE service_requests SET status = 'completed', completed_date = NOW() WHERE id = ?",
      [jobs[0].service_request_id]);
  }
  return { id };
};

const listTechnicians = async () => {
  const [rows] = await db.query('SELECT * FROM technicians WHERE is_active = 1');
  return rows;
};

const getServiceHistory = async (vinNumber) => {
  const [rows] = await db.query(
    `SELECT sr.*, jc.job_number, jc.work_done, sr_records.description AS record_description
     FROM service_requests sr LEFT JOIN job_cards jc ON jc.service_request_id = sr.id
     LEFT JOIN service_records sr_records ON sr_records.service_request_id = sr.id
     WHERE sr.vin_number = ? ORDER BY sr.created_at DESC`, [vinNumber]
  );
  return rows;
};

const getDashboardStats = async () => {
  const [stats] = await db.query(
    `SELECT
      SUM(CASE WHEN status IN ('requested','scheduled','in_progress') THEN 1 ELSE 0 END) AS open_jobs,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_jobs,
      SUM(CASE WHEN warranty_expiry <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS warranty_expiring
     FROM service_requests`
  );
  return stats[0];
};

module.exports = {
  listRequests, createRequest, createJobCard, updateJobCard,
  listTechnicians, getServiceHistory, getDashboardStats,
};
