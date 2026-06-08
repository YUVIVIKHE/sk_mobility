const db = require('../config/database');

const getUserContext = async (userId) => {
  const [users] = await db.query(
    `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.avatar_url,
            u.is_active, u.is_verified, r.id AS role_id, r.name AS role_name, r.slug AS role_slug
     FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
    [userId]
  );

  if (!users.length) return null;

  const [permissions] = await db.query(
    `SELECT p.slug FROM permissions p
     JOIN role_permissions rp ON p.id = rp.permission_id
     WHERE rp.role_id = ?`,
    [users[0].role_id]
  );

  const user = {
    ...users[0],
    permissions: permissions.map((p) => p.slug),
  };

  if (user.role_slug === 'dealer') {
    const [dealers] = await db.query(
      `SELECT id, dealer_code, business_name, status, email, phone, gst_number
       FROM dealers WHERE user_id = ?`,
      [userId]
    );
    user.dealer = dealers[0] || null;
  }

  return user;
};

module.exports = { getUserContext };
