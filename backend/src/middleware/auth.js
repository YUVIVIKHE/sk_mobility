const { verifyAccessToken } = require('../utils/jwt');
const { getUserContext } = require('../services/userContext.service');
const { AppError, asyncHandler } = require('../utils/helpers');

const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('Authentication required', 401);
  }

  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    throw new AppError('Invalid or expired token', 401);
  }

  const user = await getUserContext(decoded.userId);
  if (!user || !user.is_active) {
    throw new AppError('User not found or inactive', 401);
  }

  req.user = user;
  next();
});

const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return next();
  try {
    await authenticate(req, res, next);
  } catch {
    next();
  }
});

module.exports = { authenticate, optionalAuth };
