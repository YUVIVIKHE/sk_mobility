const db = require('../config/database');
const { paginate, paginatedResponse } = require('../utils/helpers');

const list = async (userId, filters = {}) => {
  const { page, limit, offset } = paginate(filters.page, filters.limit);
  let where = 'WHERE user_id = ?';
  const params = [userId];
  if (filters.unread) { where += ' AND is_read = 0'; }

  const [count] = await db.query(`SELECT COUNT(*) AS total FROM notifications ${where}`, params);
  const [rows] = await db.query(
    `SELECT * FROM notifications ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return paginatedResponse(rows, count[0].total, page, limit);
};

const markRead = async (id, userId) => {
  await db.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [id, userId]);
};

const markAllRead = async (userId) => {
  await db.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
};

const getUnreadCount = async (userId) => {
  const [rows] = await db.query('SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0', [userId]);
  return rows[0].count;
};

module.exports = { list, markRead, markAllRead, getUnreadCount };
