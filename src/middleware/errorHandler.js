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
 * Centralized error-handling middleware.
 * Must be registered after all routes: app.use(errorHandler)
 */
function errorHandler(err, req, res, next) {
  // SOLUTION [Level 1]: Centralized error handling
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  if (err instanceof AppError || err.statusCode) {
    return res.status(err.statusCode || 500).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  if (process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.error(err);
  }
  return res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
}

function notFoundHandler(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

module.exports = { asyncHandler, errorHandler, notFoundHandler };
