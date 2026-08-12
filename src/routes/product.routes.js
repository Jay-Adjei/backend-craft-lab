const { Router } = require('express');
const productController = require('../controllers/product.controller');
const { validate } = require('../middleware/validate');
const { authMiddleware } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { upload } = require('../middleware/upload');
const {
  createProductSchema,
  productQuerySchema,
} = require('../validators/product.schema');

const router = Router();

router.get('/', validate(productQuerySchema, 'query'), productController.list);
router.get('/:id', productController.getById);

router.post(
  '/',
  authMiddleware,
  requireRole('ADMIN'),
  validate(createProductSchema),
  productController.create
);

router.post(
  '/:id/image',
  authMiddleware,
  requireRole('ADMIN'),
  upload.single('image'),
  productController.uploadImage
);

module.exports = router;
