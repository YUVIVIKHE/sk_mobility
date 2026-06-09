const { AppError } = require('../utils/helpers');

const authorize = (...permissions) => (req, res, next) => {
  if (!req.user) return next(new AppError('Authentication required', 401));

  if (req.user.role_slug === 'super_admin') return next();

  const hasPermission = permissions.some((p) => req.user.permissions.includes(p));
  if (!hasPermission) {
    return next(new AppError('Insufficient permissions', 403));
  }
  next();
};

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user) return next(new AppError('Authentication required', 401));
  if (!roles.includes(req.user.role_slug)) {
    return next(new AppError('Access denied for this role', 403));
  }
  next();
};

module.exports = { authorize, authorizeRoles };
