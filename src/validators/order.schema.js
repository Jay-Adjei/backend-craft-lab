const { z } = require('zod');

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
  paymentStatus: z.enum(['PAID', 'UNPAID', 'FAILED']).default('PAID'),
});

module.exports = { createOrderSchema };
