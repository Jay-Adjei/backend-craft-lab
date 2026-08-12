const orderService = require('../services/order.service');
const { asyncHandler } = require('../middleware/errorHandler');

const create = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.user.id, req.body);
  res.status(201).json(order);
});

const list = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === 'ADMIN';
  const orders = await orderService.listOrdersForUser(req.user.id, { isAdmin });
  res.status(200).json({ orders });
});

const getById = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === 'ADMIN';
  const order = await orderService.getOrderById(req.params.id, req.user.id, { isAdmin });
  res.status(200).json(order);
});

module.exports = { create, list, getById };
