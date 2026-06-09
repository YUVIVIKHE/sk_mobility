const authService = require('../services/auth.service');
const { asyncHandler } = require('../utils/helpers');

exports.login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body.email, req.body.password, req);
  res.json({ success: true, data: result });
});

exports.refresh = asyncHandler(async (req, res) => {
  const result = await authService.refreshTokens(req.body.refreshToken);
  res.json({ success: true, data: result });
});

exports.logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user.id, req);
  res.json({ success: true, message: 'Logged out successfully' });
});

exports.register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json({ success: true, data: result });
});

exports.verifyEmail = asyncHandler(async (req, res) => {
  const result = await authService.verifyEmail(req.body.token);
  res.json({ success: true, data: result });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);
  res.json({ success: true, data: result });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.body.token, req.body.password);
  res.json({ success: true, data: result });
});

exports.getProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user.id, req.body);
  res.json({ success: true, data: user });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const result = await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
  res.json({ success: true, data: result });
});
