const { prisma } = require('../config/db');
const { AppError } = require('../utils/AppError');

function generateInvoiceNumber() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `INV-${stamp}-${rand}`;
}

/**
 * Place an order atomically: validate stock, deduct inventory, create order + invoice.
 */
async function createOrder(userId, { items, paymentStatus = 'PAID' }) {
  // SOLUTION [Level 3]: Wrap order creation and inventory deduction in a transaction
  return prisma.$transaction(async (tx) => {
    if (paymentStatus === 'FAILED' || paymentStatus === 'UNPAID') {
      throw new AppError('Payment must be PAID to place an order', 402);
    }

    let totalAmount = 0;
    const lineItems = [];

    for (const line of items) {
      const product = await tx.product.findUnique({
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

      await tx.inventoryItem.update({
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

    const order = await tx.order.create({
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
  });
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
