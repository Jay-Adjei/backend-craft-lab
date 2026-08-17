const { z } = require('zod');

const createInventorySchema = z.object({
  productId: z.string().min(1).optional(),
  name: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).optional(),
  sku: z.string().min(2).max(64).optional(),
  price: z.number().positive().optional(),
  category: z.string().max(100).optional(),
  quantity: z.number().int().min(0),
  location: z.string().max(100).optional(),
  reorderAt: z.number().int().min(0).optional(),
}).refine(
  (data) => data.productId || (data.name && data.sku && data.price !== undefined),
  {
    message: 'Provide productId OR name, sku, and price to create a product with inventory',
  }
);

const updateInventorySchema = z.object({
  quantity: z.number().int().min(0).optional(),
  location: z.string().max(100).optional(),
  reorderAt: z.number().int().min(0).optional(),
});

module.exports = { createInventorySchema, updateInventorySchema };
