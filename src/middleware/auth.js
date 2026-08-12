const { AppError } = require('../utils/AppError');
const { verifyAccessToken } = require('../utils/jwt');

/**
 * Authenticates requests using a Bearer JWT access token.
 * Attaches decoded payload to req.user: { id, email, role }
 */
function authMiddleware(req, res, next) {
  // SOLUTION [Level 2]: Extract and verify JWT from Authorization header
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError('Authentication required', 401));
  }

  const token = header.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Token expired', 401));
    }
    return next(new AppError('Invalid token', 401));
  }
}

/**
 * Optional auth — attaches user if token present, otherwise continues.
 */
function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next();
  }
  try {
    const payload = verifyAccessToken(header.slice(7));
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    // ignore invalid optional tokens
  }
  return next();
}

module.exports = { authMiddleware, optionalAuth };
