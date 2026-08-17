const { AppError } = require('../utils/AppError');
const { verifyAccessToken } = require('../utils/jwt');

/**
 * Authenticates requests using a Bearer JWT access token.
 * Attaches decoded payload to req.user: { id, email, role }
 *
 * TODO [Level 2]: Extract and verify JWT token from Authorization header
 *
 * Steps:
 * 1. Read req.headers.authorization (expect "Bearer <token>")
 * 2. If missing/malformed → next(new AppError('Authentication required', 401))
 * 3. Extract the token (everything after "Bearer ")
 * 4. const payload = verifyAccessToken(token)
 * 5. req.user = { id: payload.sub, email: payload.email, role: payload.role }
 * 6. Catch TokenExpiredError → 401 "Token expired"
 * 7. Catch other verify errors → 401 "Invalid token"
 */
function authMiddleware(req, res, next) {
  // TODO [Level 2]: Extract and verify JWT token from Authorization header
  // Broken stub: ignores the Authorization header and continues unauthenticated.
  void verifyAccessToken;
  void AppError;
  req.user = undefined;
  return next();
}

/**
 * Optional auth — attaches user if token present, otherwise continues.
 * (Provided complete — focus on authMiddleware above.)
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
