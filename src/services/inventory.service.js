const { prisma } = require('../config/db');
const { AppError } = require('../utils/AppError');

/**
 * Create inventory — either attach to an existing product or create product + inventory.
 */
async function createInventoryItem(data) {
  // SOLUTION [Level 1]: Inventory create logic
  if (data.productId) {
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
      include: { inventory: true },
    });
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    if (product.inventory) {
      throw new AppError('Inventory already exists for this product', 409);
    }

    return prisma.inventoryItem.create({
      data: {
        productId: data.productId,
        quantity: data.quantity,
        location: data.location,
        reorderAt: data.reorderAt ?? 10,
      },
      include: { product: true },
    });
  }

  const existingSku = await prisma.product.findUnique({ where: { sku: data.sku } });
  if (existingSku) {
    throw new AppError('SKU already exists', 409);
  }

  const product = await prisma.product.create({
    data: {
      name: data.name,
      description: data.description,
      sku: data.sku,
      price: data.price,
      category: data.category,
      inventory: {
        create: {
          quantity: data.quantity,
          location: data.location,
          reorderAt: data.reorderAt ?? 10,
        },
      },
    },
  });

  return prisma.inventoryItem.findUnique({
    where: { productId: product.id },
    include: { product: true },
  });
}

async function listInventoryItems() {
  // SOLUTION [Level 1]: List inventory with product relation
  return prisma.inventoryItem.findMany({
    include: { product: true },
    orderBy: { updatedAt: 'desc' },
  });
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
