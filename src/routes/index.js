const { Router } = require('express');
const authRoutes = require('./auth.routes');
const inventoryRoutes = require('./inventory.routes');
const productRoutes = require('./product.routes');
const orderRoutes = require('./order.routes');

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'backend-craft-lab' });
});

router.use('/auth', authRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);

module.exports = router;
