const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const testDbPath = path.join(__dirname, '..', 'prisma', 'test.db');

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = `file:${testDbPath}`;
process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-32chars!!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-32chars!';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.BCRYPT_SALT_ROUNDS = '4';

const prisma = new PrismaClient();

async function resetDatabase() {
  // SQLite: wipe and recreate schema via Prisma migrate/db push is heavy;
  // instead delete related rows in dependency order.
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
}

beforeAll(async () => {
  // Ensure test DB file exists and schema is applied (done in global setup script / npm test prep)
  if (!fs.existsSync(testDbPath)) {
    // eslint-disable-next-line no-console
    console.warn('test.db missing — run: DATABASE_URL="file:./test.db" npx prisma db push');
  }
});

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

module.exports = { prisma, resetDatabase };
