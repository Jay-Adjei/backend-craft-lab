const inventoryService = require('../services/inventory.service');
const { asyncHandler } = require('../middleware/errorHandler');

const create = asyncHandler(async (req, res) => {
  // SOLUTION [Level 1]: Create inventory via service
  const item = await inventoryService.createInventoryItem(req.body);
  res.status(201).json(item);
});

const list = asyncHandler(async (req, res) => {
  // SOLUTION [Level 1]: List inventory via service
  const items = await inventoryService.listInventoryItems();
  res.status(200).json({ items });
});

const getById = asyncHandler(async (req, res) => {
  const item = await inventoryService.getInventoryById(req.params.id);
  res.status(200).json(item);
});

const update = asyncHandler(async (req, res) => {
  const item = await inventoryService.updateInventoryItem(req.params.id, req.body);
  res.status(200).json(item);
});

/**
 * Demo endpoint that always throws — used to verify error middleware.
 */
const boom = asyncHandler(async () => {
  throw new Error('Intentional explosion for error-handler lab');
});

module.exports = { create, list, getById, update, boom };
