const { prisma } = require('../config/db');
const { AppError } = require('../utils/AppError');

function generateInvoiceNumber() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `INV-${stamp}-${rand}`;
}

/**
 * Place an order: validate stock, deduct inventory, create order + invoice.
 *
 * TODO [Level 3]: Wrap order creation and inventory deduction in a database transaction
 *
 * Current (broken) behavior intentionally:
 * 1. Deducts stock immediately (no transaction)
 * 2. Checks paymentStatus AFTER stock was already changed
 * 3. If payment fails, stock stays deducted → data corruption / race conditions
 *
 * Fix:
 * - Use prisma.$transaction(async (tx) => { ... })
 * - Reject FAILED/UNPAID payment BEFORE any inventory updates
 * - Perform all reads/writes with `tx` instead of `prisma`
 */
async function createOrder(userId, { items, paymentStatus = 'PAID' }) {
  // TODO [Level 3]: Wrap order creation and inventory deduction in a database transaction
  // Broken lab implementation — do not ship this pattern.
  let totalAmount = 0;
  const lineItems = [];

  for (const line of items) {
    const product = await prisma.product.findUnique({
      where: { id: line.productId },
      include: { inventory: true },
    });

    if (!product || !product.isActive) {
      throw new AppError(`Product not found: ${line.productId}`, 404);
    }

    if (!product.inventory) {
      throw new AppError(`No inventory for product: ${product.name}`, 400);
    }

    if (product.inventory.quantity < line.quantity) {
      throw new AppError(
        `Insufficient stock for ${product.name}. Available: ${product.inventory.quantity}`,
        409
      );
    }

    // ❌ BUG: stock deducted outside a transaction and before payment is confirmed
    await prisma.inventoryItem.update({
      where: { id: product.inventory.id },
      data: { quantity: { decrement: line.quantity } },
    });

    totalAmount += product.price * line.quantity;
    lineItems.push({
      productId: product.id,
      quantity: line.quantity,
      unitPrice: product.price,
    });
  }

  // ❌ BUG: payment check happens AFTER inventory mutation
  if (paymentStatus === 'FAILED' || paymentStatus === 'UNPAID') {
    throw new AppError('Payment must be PAID to place an order', 402);
  }

  const order = await prisma.order.create({
    data: {
      userId,
      status: 'PAID',
      paymentStatus: 'PAID',
      totalAmount,
      invoiceNumber: generateInvoiceNumber(),
      items: { create: lineItems },
    },
    include: {
      items: { include: { product: true } },
    },
  });

  return order;
}

async function listOrdersForUser(userId, { isAdmin = false } = {}) {
  return prisma.order.findMany({
    where: isAdmin ? undefined : { userId },
    include: {
      items: { include: { product: true } },
      user: { select: { id: true, email: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function getOrderById(id, userId, { isAdmin = false } = {}) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: true } },
      user: { select: { id: true, email: true, name: true } },
    },
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (!isAdmin && order.userId !== userId) {
    throw new AppError('Forbidden', 403);
  }

  return order;
}

module.exports = {
  createOrder,
  listOrdersForUser,
  getOrderById,
  generateInvoiceNumber,
};
