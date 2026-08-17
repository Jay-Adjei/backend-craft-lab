const { Router } = require('express');
const inventoryController = require('../controllers/inventory.controller');
const { validate } = require('../middleware/validate');
const { authMiddleware } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const {
  createInventorySchema,
  updateInventorySchema,
} = require('../validators/inventory.schema');

const router = Router();

// Public-ish read for lab simplicity; writes require ADMIN
router.get('/', inventoryController.list);
router.get('/boom', inventoryController.boom);
router.get('/:id', inventoryController.getById);

router.post(
  '/',
  authMiddleware,
  requireRole('ADMIN'),
  validate(createInventorySchema),
  inventoryController.create
);

router.patch(
  '/:id',
  authMiddleware,
  requireRole('ADMIN'),
  validate(updateInventorySchema),
  inventoryController.update
);

module.exports = router;
