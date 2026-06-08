const db = require('../config/database');
const config = require('../config');
const {
  hashPassword, comparePassword, signAccessToken, signRefreshToken, verifyRefreshToken,
} = require('../utils/jwt');
const { AppError, generateToken } = require('../utils/helpers');
const { sendEmail } = require('../utils/email');
const { createAuditLog } = require('../utils/audit');
const { getUserContext } = require('./userContext.service');

const getUserByEmail = async (email) => {
  const [rows] = await db.query(
    `SELECT u.*, r.name AS role_name, r.slug AS role_slug
     FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ?`,
    [email]
  );
  return rows[0];
};

const login = async (email, password, req) => {
  const user = await getUserByEmail(email);
  if (!user || !(await comparePassword(password, user.password_hash))) {
    throw new AppError('Invalid email or password', 401);
  }
  if (!user.is_active) throw new AppError('Account is deactivated', 403);
  if (!user.is_verified) throw new AppError('Please verify your email first', 403);

  const payload = { userId: user.id, role: user.role_slug };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  const refreshHash = await hashPassword(refreshToken);

  await db.query('UPDATE users SET refresh_token_hash = ?, last_login_at = NOW() WHERE id = ?', [refreshHash, user.id]);
  await createAuditLog({ userId: user.id, action: 'login', module: 'auth', req });

  const fullUser = await getUserContext(user.id);
  return { user: fullUser, accessToken, refreshToken };
};

const refreshTokens = async (refreshToken) => {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError('Invalid refresh token', 401);
  }

  const [users] = await db.query('SELECT * FROM users WHERE id = ? AND is_active = 1', [decoded.userId]);
  if (!users.length || !users[0].refresh_token_hash) throw new AppError('Invalid refresh token', 401);

  const valid = await comparePassword(refreshToken, users[0].refresh_token_hash);
  if (!valid) throw new AppError('Invalid refresh token', 401);

  const payload = { userId: decoded.userId, role: decoded.role };
  const accessToken = signAccessToken(payload);
  const newRefreshToken = signRefreshToken(payload);
  const refreshHash = await hashPassword(newRefreshToken);
  await db.query('UPDATE users SET refresh_token_hash = ? WHERE id = ?', [refreshHash, decoded.userId]);

  return { accessToken, refreshToken: newRefreshToken };
};

const logout = async (userId, req) => {
  await db.query('UPDATE users SET refresh_token_hash = NULL WHERE id = ?', [userId]);
  await createAuditLog({ userId, action: 'logout', module: 'auth', req });
};

const register = async ({ email, password, firstName, lastName, phone, roleSlug = 'dealer' }) => {
  const existing = await getUserByEmail(email);
  if (existing) throw new AppError('Email already registered', 409);

  const [roles] = await db.query('SELECT id FROM roles WHERE slug = ?', [roleSlug]);
  if (!roles.length) throw new AppError('Invalid role', 400);

  const passwordHash = await hashPassword(password);
  const verificationToken = generateToken();

  const [result] = await db.query(
    `INSERT INTO users (role_id, email, password_hash, first_name, last_name, phone, email_verification_token)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [roles[0].id, email, passwordHash, firstName, lastName, phone, verificationToken]
  );

  const verifyUrl = `${config.frontendUrl}/verify-email?token=${verificationToken}`;
  await sendEmail({
    to: email,
    subject: 'Verify your SK Mobility account',
    html: `<p>Welcome to SK Mobility! <a href="${verifyUrl}">Click here to verify your email</a>.</p>`,
  });

  return { userId: result.insertId, message: 'Registration successful. Please verify your email.' };
};

const verifyEmail = async (token) => {
  const [users] = await db.query(
    'SELECT id FROM users WHERE email_verification_token = ? AND is_verified = 0',
    [token]
  );
  if (!users.length) throw new AppError('Invalid or expired verification token', 400);

  await db.query(
    'UPDATE users SET is_verified = 1, email_verified_at = NOW(), email_verification_token = NULL WHERE id = ?',
    [users[0].id]
  );
  return { message: 'Email verified successfully' };
};

const forgotPassword = async (email) => {
  const user = await getUserByEmail(email);
  if (!user) return { message: 'If the email exists, a reset link has been sent' };

  const resetToken = generateToken();
  const expires = new Date(Date.now() + 3600000);
  await db.query(
    'UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?',
    [resetToken, expires, user.id]
  );

  const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;
  await sendEmail({
    to: email,
    subject: 'Reset your SK Mobility password',
    html: `<p><a href="${resetUrl}">Click here to reset your password</a>. Link expires in 1 hour.</p>`,
  });

  return { message: 'If the email exists, a reset link has been sent' };
};

const resetPassword = async (token, newPassword) => {
  const [users] = await db.query(
    'SELECT id FROM users WHERE password_reset_token = ? AND password_reset_expires > NOW()',
    [token]
  );
  if (!users.length) throw new AppError('Invalid or expired reset token', 400);

  const passwordHash = await hashPassword(newPassword);
  await db.query(
    'UPDATE users SET password_hash = ?, password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?',
    [passwordHash, users[0].id]
  );
  return { message: 'Password reset successful' };
};

const updateProfile = async (userId, data) => {
  const fields = [];
  const values = [];
  ['first_name', 'last_name', 'phone', 'avatar_url'].forEach((key) => {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  });
  if (!fields.length) throw new AppError('No fields to update', 400);

  values.push(userId);
  await db.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);

  return getUserContext(userId);
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const [users] = await db.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
  if (!(await comparePassword(currentPassword, users[0].password_hash))) {
    throw new AppError('Current password is incorrect', 400);
  }
  const passwordHash = await hashPassword(newPassword);
  await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
  return { message: 'Password changed successfully' };
};

module.exports = {
  login, refreshTokens, logout, register, verifyEmail,
  forgotPassword, resetPassword, updateProfile, changePassword, getUserByEmail,
};
