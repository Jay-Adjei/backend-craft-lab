const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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

describe('Level 2 — Auth, JWT, RBAC & Security', () => {
  test('register hashes password and returns tokens', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'new@test.com',
      password: 'Password123!',
      name: 'New User',
    });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('new@test.com');
    expect(res.body.user).not.toHaveProperty('passwordHash');
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();

    const stored = await prisma.user.findUnique({ where: { email: 'new@test.com' } });
    expect(stored.passwordHash).not.toBe('Password123!');
    const match = await bcrypt.compare('Password123!', stored.passwordHash);
    expect(match).toBe(true);
  });

  test('login returns access token; /auth/me requires valid Bearer token', async () => {
    await createUser({ email: 'login@test.com', password: 'Password123!' });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.com', password: 'Password123!' });

    expect(login.status).toBe(200);
    expect(login.body.accessToken).toBeDefined();

    const unauthorized = await request(app).get('/api/auth/me');
    expect(unauthorized.status).toBe(401);

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`);

    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe('login@test.com');
  });

  test('expired JWT is rejected with 401', async () => {
    const user = await createUser({ email: 'expired@test.com' });
    const expired = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: -10 }
    );

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expired}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/expired|invalid|auth/i);
  });

  test('RBAC: CUSTOMER cannot create inventory (ADMIN only)', async () => {
    await createUser({
      email: 'cust@test.com',
      password: 'Password123!',
      role: 'CUSTOMER',
    });
    await createUser({
      email: 'adm@test.com',
      password: 'Admin123!',
      role: 'ADMIN',
    });

    const customerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'cust@test.com', password: 'Password123!' });

    const denied = await request(app)
      .post('/api/inventory')
      .set('Authorization', `Bearer ${customerLogin.body.accessToken}`)
      .send({
        name: 'Should Fail',
        sku: 'FAIL-1',
        price: 1,
        quantity: 1,
      });

    expect(denied.status).toBe(403);

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'adm@test.com', password: 'Admin123!' });

    const allowed = await request(app)
      .post('/api/inventory')
      .set('Authorization', `Bearer ${adminLogin.body.accessToken}`)
      .send({
        name: 'Should Pass',
        sku: 'PASS-1',
        price: 10,
        quantity: 5,
      });

    expect(allowed.status).toBe(201);
  });

  test('RBAC: CUSTOMER cannot create products', async () => {
    await createUser({
      email: 'c2@test.com',
      password: 'Password123!',
      role: 'CUSTOMER',
    });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'c2@test.com', password: 'Password123!' });

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .send({
        name: 'Nope',
        sku: 'NOPE',
        price: 5,
        quantity: 1,
      });

    expect(res.status).toBe(403);
  });

  test('refresh token rotation works', async () => {
    await createUser({ email: 'refresh@test.com', password: 'Password123!' });
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'refresh@test.com', password: 'Password123!' });

    const refreshed = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: login.body.refreshToken });

    expect(refreshed.status).toBe(200);
    expect(refreshed.body.accessToken).toBeDefined();
    expect(refreshed.body.refreshToken).not.toBe(login.body.refreshToken);
  });
});
