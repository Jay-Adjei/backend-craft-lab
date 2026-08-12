const { Router } = require('express');
const orderController = require('../controllers/order.controller');
const { validate } = require('../middleware/validate');
const { authMiddleware } = require('../middleware/auth');
const { createOrderSchema } = require('../validators/order.schema');

const router = Router();

router.use(authMiddleware);

router.post('/', validate(createOrderSchema), orderController.create);
router.get('/', orderController.list);
router.get('/:id', orderController.getById);

module.exports = router;
