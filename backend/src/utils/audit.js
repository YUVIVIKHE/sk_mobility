const db = require('../config/database');
const logger = require('./logger');

const createAuditLog = async ({ userId, action, module, entityType, entityId, oldValues, newValues, req }) => {
  try {
    await db.query(
      `INSERT INTO audit_logs (user_id, action, module, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId || null,
        action,
        module,
        entityType || null,
        entityId || null,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        req?.ip || null,
        req?.headers?.['user-agent']?.substring(0, 500) || null,
      ]
    );
  } catch (err) {
    logger.error('Audit log failed:', err.message);
  }
};

module.exports = { createAuditLog };
