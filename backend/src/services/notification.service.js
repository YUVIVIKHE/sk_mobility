const db = require('../config/database');
const { sendEmail } = require('../utils/email');
const logger = require('../utils/logger');

const createNotification = async ({ userId, title, message, type, channel = 'in_app', metadata = null }) => {
  const [result] = await db.query(
    `INSERT INTO notifications (user_id, title, message, type, channel, metadata) VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, title, message, type, channel, metadata ? JSON.stringify(metadata) : null]
  );

  if (channel === 'email') {
    const [users] = await db.query('SELECT email FROM users WHERE id = ?', [userId]);
    if (users[0]?.email) {
      await sendEmail({ to: users[0].email, subject: title, html: `<p>${message}</p>` });
    }
  }

  if (channel === 'sms') {
    logger.info(`[SMS MOCK] User ${userId}: ${title} - ${message}`);
  }

  if (channel === 'whatsapp') {
    logger.info(`[WHATSAPP MOCK] User ${userId}: ${title} - ${message}`);
  }

  return result.insertId;
};

const notifyAdmins = async ({ title, message, type, channels = ['in_app'] }) => {
  const [admins] = await db.query(
    `SELECT u.id FROM users u JOIN roles r ON u.role_id = r.id WHERE r.slug = 'super_admin' AND u.is_active = 1`
  );
  for (const admin of admins) {
    for (const channel of channels) {
      await createNotification({ userId: admin.id, title, message, type, channel });
    }
  }
};

const notifyDealer = async (dealerId, { title, message, type, channels = ['in_app'] }) => {
  const [dealers] = await db.query('SELECT user_id FROM dealers WHERE id = ?', [dealerId]);
  if (!dealers[0]?.user_id) return;
  for (const channel of channels) {
    await createNotification({ userId: dealers[0].user_id, title, message, type, channel });
  }
};

module.exports = { createNotification, notifyAdmins, notifyDealer };
