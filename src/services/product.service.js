const { prisma } = require('../config/db');
const { AppError } = require('../utils/AppError');

async function createProduct(data) {
  const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
  if (existing) {
    throw new AppError('SKU already exists', 409);
  }

  return prisma.product.create({
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
        },
      },
    },
    include: { inventory: true },
  });
}

/**
 * Paginated, filterable product listing.
 *
 * TODO [Level 3]: Implement pagination, filtering, and dynamic search
 *
 * Build a Prisma `where` from query:
 * - search → OR on name/description/sku contains
 * - category → exact match
 * - minPrice / maxPrice → price.gte / price.lte
 * - Always filter isActive: true
 *
 * Then:
 * - skip = (page - 1) * limit
 * - findMany with orderBy: { [sortBy]: sortOrder }, skip, take: limit
 * - count with the same where
 * - return { items, pagination: { page, limit, total, totalPages } }
 */
async function listProducts(query) {
  // TODO [Level 3]: Implement pagination / filtering / search
  // Stub returns every active product and ignores query params.
  void query;
  const items = await prisma.product.findMany({
    where: { isActive: true },
    include: { inventory: true },
  });

  return {
    items,
    pagination: {
      page: 1,
      limit: items.length,
      total: items.length,
      totalPages: 1,
    },
  };
}

async function getProductById(id) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { inventory: true },
  });
  if (!product) {
    throw new AppError('Product not found', 404);
  }
  return product;
}

async function attachProductImage(id, imageUrl) {
  await getProductById(id);
  return prisma.product.update({
    where: { id },
    data: { imageUrl },
    include: { inventory: true },
  });
}

module.exports = {
  createProduct,
  listProducts,
  getProductById,
  attachProductImage,
};
