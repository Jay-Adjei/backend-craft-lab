const { ZodError } = require('zod');
const { AppError } = require('../utils/AppError');

/**
 * Wraps async route handlers so rejected promises reach the error middleware.
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * TODO [Level 1]: Implement centralized error handling middleware
 *
 * Requirements:
 * - If err is a ZodError, respond with 400 and { error: 'Validation failed', details: [...] }
 * - If err is an AppError (or has statusCode), use that status and message
 * - Otherwise respond with 500 and a safe message
 *
 * Hint: ZodError exposes err.errors with { path, message } entries.
 * Hint: AppError is defined in src/utils/AppError.js
 *
 * Until implemented, every error becomes a generic 500 — validation & 404s look like crashes.
 */
function errorHandler(err, req, res, next) {
  // TODO [Level 1]: Implement centralized error handling middleware
  // Replace this stub with proper ZodError / AppError / fallback handling.
  // Keep the 4-arg signature (err, req, res, next) so Express treats this as error middleware.
  void ZodError;
  void AppError;
  void next;

  return res.status(500).json({
    error: 'Unhandled error (error handler incomplete)',
  });
}

function notFoundHandler(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

module.exports = { asyncHandler, errorHandler, notFoundHandler };
