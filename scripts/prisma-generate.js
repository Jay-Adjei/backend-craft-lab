#!/usr/bin/env node
/**
 * Runs `prisma generate` without failing `npm install`.
 *
 * On Windows, Prisma's query_engine-windows.dll.node is often locked by
 * VS Code, a running `node` process, antivirus, or a previous generate.
 * That surfaces as EPERM during postinstall and aborts the whole install.
 */
'use strict';

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const prismaJs = path.join(__dirname, '..', 'node_modules', 'prisma', 'build', 'index.js');

if (!fs.existsSync(prismaJs)) {
  console.warn('prisma CLI not found yet — skip generate');
  process.exit(0);
}

const result = spawnSync(process.execPath, [prismaJs, 'generate'], {
  stdio: 'inherit',
  env: process.env,
});

if (result.status === 0) {
  process.exit(0);
}

console.warn('\n⚠️  prisma generate did not complete (common on Windows: EPERM / file lock).');
console.warn('    npm install can still succeed. Close running Node/VS Code Prisma processes, then run:\n');
console.warn('      npm run db:generate\n');
process.exit(0);
