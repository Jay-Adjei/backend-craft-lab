const inventoryService = require("../services/inventory.service");
const { asyncHandler } = require("../middleware/errorHandler");

const create = asyncHandler(async (req, res) => {
  // TODO [Level 1]: Call inventoryService.createInventoryItem(req.body) and return 201
  // Stub keeps the server bootable while the service is incomplete.
  const inventory = await inventoryService.createInventoryItem(req.body);
  return res.status(201).json(inventory);
});

const list = asyncHandler(async (req, res) => {
  // TODO [Level 1]: Call inventoryService.listInventoryItems() and return { items }

  const items = await inventoryService.listInventoryItems();
  return res.status(200).json({ items });
});

const getById = asyncHandler(async (req, res) => {
  const item = await inventoryService.getInventoryById(req.params.id);
  res.status(200).json(item);
});

const update = asyncHandler(async (req, res) => {
  const item = await inventoryService.updateInventoryItem(
    req.params.id,
    req.body,
  );
  res.status(200).json(item);
});

/**
 * Demo endpoint that always throws — used to verify error middleware.
 */
const boom = asyncHandler(async () => {
  throw new Error("Intentional explosion for error-handler lab");
});

module.exports = { create, list, getById, update, boom };
