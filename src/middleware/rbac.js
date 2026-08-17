const { AppError } = require('../utils/AppError');

/**
 * Role-Based Access Control middleware factory.
 * Usage: requireRole('ADMIN') or requireRole('ADMIN', 'CUSTOMER')
 *
 * TODO [Level 2]: Implement RBAC so only allowed roles can proceed
 * - If !req.user → 401 Authentication required
 * - If req.user.role is not in allowedRoles → 403 Forbidden
 * - Otherwise next()
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    // TODO [Level 2]: Implement RBAC role check
    // Broken stub: allows every request through (even non-admins on admin routes).
    void allowedRoles;
    void AppError;
    void req;
    return next();
  };
}

module.exports = { requireRole };
