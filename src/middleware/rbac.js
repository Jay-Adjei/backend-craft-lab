const { AppError } = require('../utils/AppError');

/**
 * Role-Based Access Control middleware factory.
 * Usage: requireRole('ADMIN') or requireRole('ADMIN', 'CUSTOMER')
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    // SOLUTION [Level 2]: RBAC check
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('Forbidden: insufficient permissions', 403));
    }

    return next();
  };
}

module.exports = { requireRole };
