'use strict';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-coconexus';
process.env.RATE_LIMIT_MAX_REQUESTS = process.env.RATE_LIMIT_MAX_REQUESTS || '10000';
process.env.AUTH_RATE_LIMIT_MAX_REQUESTS = process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '10000';

const bcrypt = require('bcryptjs');
const { sequelize, User, UserProfile } = require('../models');

async function main() {
  await sequelize.sync({ force: true });

  const password = await bcrypt.hash('Admin12345', 12);
  const admin = await User.create({
    email: 'admin.newman@coconexus.local',
    password,
    role: 'admin',
  });

  await UserProfile.create({
    user_id: admin.id,
    full_name: 'Admin Newman',
    bio: 'Akun admin untuk pengujian API Newman.',
    avatar_url: null,
  });
}

main()
  .then(async () => {
    await sequelize.close();
    console.log('Database test Newman berhasil disiapkan.');
  })
  .catch(async (error) => {
    console.error('Gagal menyiapkan database test Newman:', error);
    await sequelize.close();
    process.exit(1);
  });
