const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { validate } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const { authMiddleware } = require('../middleware/auth');
const {
  registerSchema,
  loginSchema,
  refreshSchema,
} = require('../validators/auth.schema');

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authLimiter, validate(refreshSchema), authController.refresh);
router.get('/me', authMiddleware, authController.me);

module.exports = router;
