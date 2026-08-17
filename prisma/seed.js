require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

  const adminPassword = await bcrypt.hash('Admin123!', saltRounds);
  const customerPassword = await bcrypt.hash('Customer123!', saltRounds);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@lab.local' },
    update: {},
    create: {
      email: 'admin@lab.local',
      name: 'Lab Admin',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@lab.local' },
    update: {},
    create: {
      email: 'customer@lab.local',
      name: 'Lab Customer',
      passwordHash: customerPassword,
      role: 'CUSTOMER',
    },
  });

  const products = [
    {
      name: 'Wireless Mouse',
      description: 'Ergonomic 2.4GHz wireless mouse',
      sku: 'WM-001',
      price: 29.99,
      category: 'Electronics',
      quantity: 50,
      location: 'A-1',
    },
    {
      name: 'USB-C Hub',
      description: '7-in-1 USB-C multiport adapter',
      sku: 'UCH-002',
      price: 49.99,
      category: 'Electronics',
      quantity: 30,
      location: 'A-2',
    },
    {
      name: 'Notebook Pack',
      description: 'Set of 3 dotted notebooks',
      sku: 'NB-003',
      price: 12.5,
      category: 'Stationery',
      quantity: 100,
      location: 'B-1',
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        name: p.name,
        description: p.description,
        sku: p.sku,
        price: p.price,
        category: p.category,
        inventory: {
          create: {
            quantity: p.quantity,
            location: p.location,
            reorderAt: 10,
          },
        },
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log('Seed complete:');
  // eslint-disable-next-line no-console
  console.log(`  Admin:    admin@lab.local / Admin123!  (${admin.id})`);
  // eslint-disable-next-line no-console
  console.log(`  Customer: customer@lab.local / Customer123!  (${customer.id})`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
