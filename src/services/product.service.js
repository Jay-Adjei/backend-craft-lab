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
 */
async function listProducts(query) {
  // SOLUTION [Level 3]: Pagination, filtering, and dynamic search
  const {
    page = 1,
    limit = 10,
    search,
    category,
    minPrice,
    maxPrice,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query;

  const where = {
    isActive: true,
  };

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
      { sku: { contains: search } },
    ];
  }

  if (category) {
    where.category = category;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = minPrice;
    if (maxPrice !== undefined) where.price.lte = maxPrice;
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { inventory: true },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
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
