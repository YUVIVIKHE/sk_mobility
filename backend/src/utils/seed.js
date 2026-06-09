/**
 * Seed script - creates admin user with proper bcrypt hash
 * Run: npm run seed
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const config = require('../config');

async function seed() {
  const conn = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    multipleStatements: true,
  });

  console.log('Running schema...');
  const schema = fs.readFileSync(path.join(__dirname, '../../../database/schema.sql'), 'utf8');
  await conn.query(schema);

  console.log('Running seed data...');
  const seedSql = fs.readFileSync(path.join(__dirname, '../../../database/seed.sql'), 'utf8');
  await conn.query(seedSql);

  const passwordHash = await bcrypt.hash('Admin@123', 12);
  await conn.query('USE sk_mobility');
  await conn.query(
    'UPDATE users SET password_hash = ? WHERE email = ?',
    [passwordHash, 'admin@skmobility.com']
  );

  // Create sample approved dealer with user
  const dealerHash = await bcrypt.hash('Dealer@123', 12);
  const [roles] = await conn.query("SELECT id FROM roles WHERE slug = 'dealer'");
  const [existingDealer] = await conn.query("SELECT id FROM users WHERE email = 'dealer@skmobility.com'");

  if (!existingDealer.length) {
    const [userResult] = await conn.query(
      `INSERT INTO users (role_id, email, password_hash, first_name, last_name, phone, is_active, is_verified, email_verified_at)
       VALUES (?, 'dealer@skmobility.com', ?, 'Demo', 'Dealer', '9876543211', 1, 1, NOW())`,
      [roles[0].id, dealerHash]
    );
    await conn.query(
      `INSERT INTO dealers (user_id, dealer_code, business_name, contact_person, email, phone, gst_number, status, approved_at)
       VALUES (?, 'DLR-DEMO-001', 'Demo EV Motors', 'Demo Dealer', 'dealer@skmobility.com', '9876543211', '27AABCD1234E1Z5', 'approved', NOW())`,
      [userResult.insertId]
    );
    console.log('Created demo dealer: dealer@skmobility.com / Dealer@123');
  }

  console.log('Seed completed!');
  console.log('Super Admin: admin@skmobility.com / Admin@123');
  await conn.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
