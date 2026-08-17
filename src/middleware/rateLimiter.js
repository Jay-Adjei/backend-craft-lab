const rateLimit = require('express-rate-limit');
const { env } = require('../config/env');

const globalLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
  // Disable in test env so suites are not flaky
  skip: () => process.env.NODE_ENV === 'test',
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts, please try again later' },
  skip: () => process.env.NODE_ENV === 'test',
});

module.exports = { globalLimiter, authLimiter };
