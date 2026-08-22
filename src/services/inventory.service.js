const { prisma } = require("../config/db");
const { AppError } = require("../utils/AppError");

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
  if (data.productId) {
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
      include: { inventory: true },
    });
    if (!product) {
      throw new AppError("Product not found", 404);
    }
    if (product.inventory) {
      throw new AppError("Inventory already exists for this product", 409);
    }
    return prisma.inventoryItem.create({
      data: {
        productId: data.productId,
        location: data?.location,
        quantity: data?.quantity ?? 0,
        reorderAt: data.reorderAt ?? 10,
      },
      include: { product: true },
    });
  } else {
    const existingShu = await prisma.product.findUnique({
      where: { sku: data.sku },
    });
    if (existingShu) {
      throw new AppError("SKU already exists", 409);
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
            quantity: data.quantity ?? 0,
            location: data.location,
            reorderAt: data.reorderAt ?? 10,
          },
        },
      },
    });
    return await prisma.inventoryItem.findUnique({
      where: { productId: product.id },
      include: { product: true },
    });
  }
}

/**
 * TODO [Level 1]: List all inventory items with their related product
 * Use prisma.inventoryItem.findMany({ include: { product: true }, orderBy: { updatedAt: 'desc' } })
 */
async function listInventoryItems() {
  // TODO [Level 1]: Implement listInventoryItems query
  const inventoryItems = await prisma.inventoryItem.findMany({
    include: { product: true },
    orderBy: { updatedAt: "desc" },
  });
  return inventoryItems;
}

async function getInventoryById(id) {
  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    include: { product: true },
  });
  if (!item) {
    throw new AppError("Inventory item not found", 404);
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
