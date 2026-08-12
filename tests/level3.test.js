const request = require('supertest');
const bcrypt = require('bcryptjs');
const { createApp } = require('../src/app');
const { prisma } = require('./setup');

const app = createApp();

async function createUser({
  email,
  password = 'Password123!',
  name = 'Test User',
  role = 'CUSTOMER',
}) {
  const passwordHash = await bcrypt.hash(password, 4);
  return prisma.user.create({
    data: { email, passwordHash, name, role },
  });
}

async function seedProduct({
  name = 'Widget',
  sku = 'WDG-1',
  price = 20,
  quantity = 10,
  category = 'Gadgets',
} = {}) {
  return prisma.product.create({
    data: {
      name,
      sku,
      price,
      category,
      inventory: { create: { quantity, location: 'T-1' } },
    },
    include: { inventory: true },
  });
}

describe('Level 3 — Transactions, Pagination & Async Workflows', () => {
  test('product list supports pagination and search', async () => {
    await seedProduct({ name: 'Alpha Mouse', sku: 'A-1', price: 10, category: 'Electronics' });
    await seedProduct({ name: 'Beta Keyboard', sku: 'B-1', price: 40, category: 'Electronics' });
    await seedProduct({ name: 'Gamma Notebook', sku: 'G-1', price: 8, category: 'Stationery' });

    const page1 = await request(app).get('/api/products?page=1&limit=2&sortBy=name&sortOrder=asc');
    expect(page1.status).toBe(200);
    expect(page1.body.items).toHaveLength(2);
    expect(page1.body.pagination.total).toBe(3);
    expect(page1.body.pagination.totalPages).toBe(2);

    const search = await request(app).get('/api/products?search=Keyboard');
    expect(search.status).toBe(200);
    expect(search.body.items).toHaveLength(1);
    expect(search.body.items[0].name).toMatch(/Keyboard/);

    const filtered = await request(app).get(
      '/api/products?category=Electronics&minPrice=15&maxPrice=50'
    );
    expect(filtered.status).toBe(200);
    expect(filtered.body.items).toHaveLength(1);
    expect(filtered.body.items[0].sku).toBe('B-1');
  });

  test('order creation deducts stock and creates invoice inside a transaction', async () => {
    const user = await createUser({ email: 'buyer@test.com', role: 'CUSTOMER' });
    const product = await seedProduct({
      name: 'Limited Item',
      sku: 'LIM-1',
      price: 15,
      quantity: 5,
    });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'buyer@test.com', password: 'Password123!' });

    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .send({
        items: [{ productId: product.id, quantity: 2 }],
        paymentStatus: 'PAID',
      });

    expect(orderRes.status).toBe(201);
    expect(orderRes.body.invoiceNumber).toMatch(/^INV-/);
    expect(orderRes.body.totalAmount).toBe(30);
    expect(orderRes.body.items).toHaveLength(1);

    const inventory = await prisma.inventoryItem.findUnique({
      where: { productId: product.id },
    });
    expect(inventory.quantity).toBe(3);
  });

  test('failed payment does not deduct stock (transactional integrity)', async () => {
    await createUser({ email: 'failpay@test.com', role: 'CUSTOMER' });
    const product = await seedProduct({
      name: 'Safe Stock',
      sku: 'SAFE-1',
      price: 10,
      quantity: 4,
    });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'failpay@test.com', password: 'Password123!' });

    const before = await prisma.inventoryItem.findUnique({
      where: { productId: product.id },
    });

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .send({
        items: [{ productId: product.id, quantity: 2 }],
        paymentStatus: 'FAILED',
      });

    expect(res.status).toBe(402);

    const after = await prisma.inventoryItem.findUnique({
      where: { productId: product.id },
    });
    expect(after.quantity).toBe(before.quantity);
  });

  test('insufficient stock returns 409 and leaves inventory unchanged', async () => {
    await createUser({ email: 'overbuy@test.com', role: 'CUSTOMER' });
    const product = await seedProduct({
      name: 'Scarce',
      sku: 'SC-1',
      price: 5,
      quantity: 1,
    });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'overbuy@test.com', password: 'Password123!' });

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .send({
        items: [{ productId: product.id, quantity: 5 }],
        paymentStatus: 'PAID',
      });

    expect(res.status).toBe(409);

    const inventory = await prisma.inventoryItem.findUnique({
      where: { productId: product.id },
    });
    expect(inventory.quantity).toBe(1);
  });

  test('admin can upload a product image (multer)', async () => {
    await createUser({
      email: 'imgadmin@test.com',
      password: 'Admin123!',
      role: 'ADMIN',
    });
    const product = await seedProduct({ sku: 'IMG-1' });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'imgadmin@test.com', password: 'Admin123!' });

    const res = await request(app)
      .post(`/api/products/${product.id}/image`)
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .attach('image', Buffer.from('fake-image-bytes'), {
        filename: 'photo.png',
        contentType: 'image/png',
      });

    expect(res.status).toBe(200);
    expect(res.body.imageUrl).toMatch(/^\/uploads\//);
  });
});
