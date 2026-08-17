const { prisma } = require('../config/db');
const { AppError } = require('../utils/AppError');

/**
 * Create inventory — either attach to an existing product or create product + inventory.
 *
 * TODO [Level 1]: Implement inventory create logic
 * - If data.productId: ensure product exists and has no inventory yet, then create InventoryItem
 * - Else: create Product + nested InventoryItem (require name, sku, price)
 * - Return the InventoryItem including its product relation
 */
async function createInventoryItem(data) {
  // TODO [Level 1]: Implement createInventoryItem database logic
  void prisma;
  void data;
  throw new AppError('Not implemented: createInventoryItem', 501);
}

/**
 * TODO [Level 1]: List all inventory items with their related product
 * Use prisma.inventoryItem.findMany({ include: { product: true }, orderBy: { updatedAt: 'desc' } })
 */
async function listInventoryItems() {
  // TODO [Level 1]: Implement listInventoryItems query
  return [];
}

async function getInventoryById(id) {
  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    include: { product: true },
  });
  if (!item) {
    throw new AppError('Inventory item not found', 404);
  }
  return item;
}

async function updateInventoryItem(id, data) {
  await getInventoryById(id);
  return prisma.inventoryItem.update({
    where: { id },
    data,
    include: { product: true },
  });
}

module.exports = {
  createInventoryItem,
  listInventoryItems,
  getInventoryById,
  updateInventoryItem,
};
