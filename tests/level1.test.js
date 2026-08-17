const request = require('supertest');
const bcrypt = require('bcryptjs');
const { createApp } = require('../src/app');
const { prisma } = require('./setup');

const app = createApp();

async function createUser({
  email = 'user@test.com',
  password = 'Password123!',
  name = 'Test User',
  role = 'CUSTOMER',
} = {}) {
  const passwordHash = await bcrypt.hash(password, 4);
  return prisma.user.create({
    data: { email, passwordHash, name, role },
  });
}

async function loginAs(email, password) {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res;
}

describe('Level 1 — Routing, Validation & Error Handling', () => {
  test('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('centralized error handler returns JSON 500 for unhandled errors (not a crash)', async () => {
    const res = await request(app).get('/api/inventory/boom');
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
    expect(typeof res.body.error).toBe('string');
    // Incomplete lab stub returns a generic incomplete message; solution returns the thrown message
    expect(res.body.error.length).toBeGreaterThan(0);
  });

  test('validation rejects invalid inventory payload with 400', async () => {
    const admin = await createUser({
      email: 'admin@test.com',
      password: 'Admin123!',
      role: 'ADMIN',
    });
    const login = await loginAs(admin.email, 'Admin123!');
    expect(login.status).toBe(200);

    const res = await request(app)
      .post('/api/inventory')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .send({ quantity: -5 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/validation/i);
  });

  test('ADMIN can create inventory item with nested product', async () => {
    const admin = await createUser({
      email: 'admin2@test.com',
      password: 'Admin123!',
      role: 'ADMIN',
    });
    const login = await loginAs(admin.email, 'Admin123!');

    const res = await request(app)
      .post('/api/inventory')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .send({
        name: 'Lab Keyboard',
        sku: 'KB-100',
        price: 79.99,
        category: 'Electronics',
        quantity: 25,
        location: 'C-1',
      });

    expect(res.status).toBe(201);
    // Response shape differs slightly: product create returns inventory nested,
    // or inventory create returns product nested.
    const quantity =
      res.body.quantity ?? res.body.inventory?.quantity;
    const sku = res.body.sku ?? res.body.product?.sku;
    expect(quantity).toBe(25);
    expect(sku).toBe('KB-100');
  });

  test('GET /api/inventory lists inventory items with products', async () => {
    const product = await prisma.product.create({
      data: {
        name: 'Cable',
        sku: 'CB-1',
        price: 9.99,
        inventory: { create: { quantity: 10, location: 'Z-1' } },
      },
      include: { inventory: true },
    });

    const res = await request(app).get('/api/inventory');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.items[0]).toHaveProperty('product');
    expect(res.body.items.some((i) => i.productId === product.id || i.product?.sku === 'CB-1')).toBe(
      true
    );
  });

  test('unknown route returns 404 via notFound + error handler', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});
