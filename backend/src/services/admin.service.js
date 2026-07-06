const db = require('../config/database');
const { AppError, paginate, paginatedResponse } = require('../utils/helpers');
const { hashPassword } = require('../utils/jwt');
const { createAuditLog } = require('../utils/audit');

const listUsers = async (filters = {}) => {
  const { page, limit, offset } = paginate(filters.page, filters.limit);
  const [count] = await db.query('SELECT COUNT(*) AS total FROM users');
  const [rows] = await db.query(
    `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.is_active, u.is_verified, u.last_login_at,
            r.name AS role_name, r.slug AS role_slug
     FROM users u JOIN roles r ON u.role_id = r.id ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  return paginatedResponse(rows, count[0].total, page, limit);
};

const createUser = async (data, req) => {
  const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [data.email]);
  if (existing.length) throw new AppError('Email already exists', 409);

  // Support roleName (slug) or roleId
  let roleId = data.roleId;
  if (!roleId && data.roleName) {
    const [roleRows] = await db.query('SELECT id FROM roles WHERE slug = ? OR name = ?', [data.roleName, data.roleName]);
    if (!roleRows.length) throw new AppError(`Role '${data.roleName}' not found`, 400);
    roleId = roleRows[0].id;
  }
  if (!roleId) throw new AppError('Role is required', 400);

  const passwordHash = await hashPassword(data.password || 'User@123');
  const [result] = await db.query(
    'INSERT INTO users (role_id, email, password_hash, first_name, last_name, phone, is_active, is_verified) VALUES (?,?,?,?,?,?,?,?)',
    [roleId, data.email, passwordHash, data.firstName, data.lastName, data.phone, data.isActive ?? 1, data.isVerified ?? 0]
  );
  await createAuditLog({ userId: req.user.id, action: 'create', module: 'admin', entityType: 'user', entityId: result.insertId, req });
  return { id: result.insertId };
};

const updateUser = async (id, data, req) => {
  const updates = [];
  const params = [];

  if (data.firstName !== undefined) { updates.push('first_name = ?'); params.push(data.firstName); }
  if (data.lastName !== undefined) { updates.push('last_name = ?'); params.push(data.lastName); }
  if (data.phone !== undefined) { updates.push('phone = ?'); params.push(data.phone); }
  if (data.isActive !== undefined) { updates.push('is_active = ?'); params.push(data.isActive ? 1 : 0); }
  if (data.roleName) {
    const [roleRows] = await db.query('SELECT id FROM roles WHERE slug = ? OR name = ?', [data.roleName, data.roleName]);
    if (roleRows.length) { updates.push('role_id = ?'); params.push(roleRows[0].id); }
  } else if (data.roleId) {
    updates.push('role_id = ?'); params.push(data.roleId);
  }

  if (updates.length === 0) throw new AppError('No fields to update', 400);
  params.push(id);
  await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
  await createAuditLog({ userId: req.user.id, action: 'update', module: 'admin', entityType: 'user', entityId: id, req });
};

const toggleUserActive = async (id, req) => {
  const [[user]] = await db.query('SELECT is_active FROM users WHERE id = ?', [id]);
  if (!user) throw new AppError('User not found', 404);
  const newState = user.is_active ? 0 : 1;
  await db.query('UPDATE users SET is_active = ? WHERE id = ?', [newState, id]);
  await createAuditLog({ userId: req.user.id, action: 'update', module: 'admin', entityType: 'user', entityId: id, newValues: { is_active: newState }, req });
  return { is_active: newState };
};

const listRoles = async () => {
  const [roles] = await db.query('SELECT * FROM roles');
  for (const role of roles) {
    const [perms] = await db.query(
      `SELECT p.* FROM permissions p JOIN role_permissions rp ON p.id = rp.permission_id WHERE rp.role_id = ?`, [role.id]
    );
    role.permissions = perms;
  }
  return roles;
};

const listPermissions = async () => {
  const [rows] = await db.query('SELECT * FROM permissions ORDER BY module, name');
  return rows;
};

const updateRolePermissions = async (roleId, permissionIds, req) => {
  await db.query('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);
  for (const pid of permissionIds) {
    await db.query('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [roleId, pid]);
  }
  await createAuditLog({ userId: req.user.id, action: 'update', module: 'admin', entityType: 'role', entityId: roleId, newValues: { permissionIds }, req });
};

const listAuditLogs = async (filters = {}) => {
  const { page, limit, offset } = paginate(filters.page, filters.limit);
  let where = 'WHERE 1=1';
  const params = [];
  if (filters.module) { where += ' AND a.module = ?'; params.push(filters.module); }

  const [count] = await db.query(`SELECT COUNT(*) AS total FROM audit_logs a ${where}`, params);
  const [rows] = await db.query(
    `SELECT a.*, u.email AS user_email FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id
     ${where} ORDER BY a.created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return paginatedResponse(rows, count[0].total, page, limit);
};

const getSettings = async () => {
  const [rows] = await db.query('SELECT * FROM system_settings');
  return rows.reduce((acc, s) => ({ ...acc, [s.setting_key]: s.setting_value }), {});
};

const updateSetting = async (key, value) => {
  await db.query('UPDATE system_settings SET setting_value = ? WHERE setting_key = ?', [value, key]);
};

module.exports = {
  listUsers, createUser, updateUser, toggleUserActive,
  listRoles, listPermissions,
  updateRolePermissions, listAuditLogs, getSettings, updateSetting,
};
