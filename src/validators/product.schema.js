const { z } = require('zod');

const createProductSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  sku: z.string().min(2).max(64),
  price: z.number().positive(),
  category: z.string().max(100).optional(),
  quantity: z.number().int().min(0).default(0),
  location: z.string().max(100).optional(),
});

const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sortBy: z.enum(['name', 'price', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

module.exports = { createProductSchema, productQuerySchema };
