const productService = require('../services/product.service');
const { asyncHandler } = require('../middleware/errorHandler');

const create = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body);
  res.status(201).json(product);
});

const list = asyncHandler(async (req, res) => {
  const result = await productService.listProducts(req.query);
  res.status(200).json(result);
});

const getById = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  res.status(200).json(product);
});

const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Image file is required' });
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  const product = await productService.attachProductImage(req.params.id, imageUrl);
  res.status(200).json(product);
});

module.exports = { create, list, getById, uploadImage };
