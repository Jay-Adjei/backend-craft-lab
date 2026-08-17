const bcrypt = require('bcryptjs');
const { env } = require('../config/env');

async function hashPassword(plainText) {
  return bcrypt.hash(plainText, env.bcryptSaltRounds);
}

async function comparePassword(plainText, hash) {
  return bcrypt.compare(plainText, hash);
}

module.exports = { hashPassword, comparePassword };
