require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const config = require('../config');

(async () => {
  const conn = await mysql.createConnection({
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
  });

  const adminHash = await bcrypt.hash('Admin@123', 12);
  await conn.query('UPDATE users SET password_hash = ? WHERE email = ?', [adminHash, 'admin@skmobility.com']);

  const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', ['dealer@skmobility.com']);
  if (!existing.length) {
    const dealerHash = await bcrypt.hash('Dealer@123', 12);
    const [result] = await conn.query(
      `INSERT INTO users (role_id, email, password_hash, first_name, last_name, phone, is_active, is_verified, email_verified_at)
       VALUES (2, 'dealer@skmobility.com', ?, 'Demo', 'Dealer', '9876543211', 1, 1, NOW())`,
      [dealerHash]
    );
    await conn.query(
      `INSERT INTO dealers (user_id, dealer_code, business_name, contact_person, email, phone, gst_number, status, approved_at)
       VALUES (?, 'DLR-DEMO-001', 'Demo EV Motors', 'Demo Dealer', 'dealer@skmobility.com', '9876543211', '27AABCD1234E1Z5', 'approved', NOW())`,
      [result.insertId]
    );
  }

  const [users] = await conn.query('SELECT email FROM users');
  console.log('Passwords set. Users:', users.map((u) => u.email).join(', '));
  await conn.end();
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
