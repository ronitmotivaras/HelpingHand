const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

async function seedAdmin() {
  const existing = await Admin.findOne();
  if (existing) {
    return;
  }

  let passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!passwordHash) {
    const plain = process.env.ADMIN_PASSWORD || 'admin123';
    passwordHash = await bcrypt.hash(plain, 10);
  }

  await Admin.create({ passwordHash });
  console.log('Admin account seeded');
}

module.exports = seedAdmin;
