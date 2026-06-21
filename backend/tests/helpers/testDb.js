'use strict';

const bcrypt = require('bcryptjs');
const { sequelize, User, UserProfile } = require('../../models');

async function resetTestDatabase() {
  // reset test database tanpa mengandalkan sequelize.sync({force:true})
  // karena pada MySQL ada FK constraint antar tabel join.

  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  await sequelize.drop();
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

  // Buat ulang schema dari models
  await sequelize.sync({ force: true });
}






async function createAdminUser(overrides = {}) {
  const password = overrides.password || 'Admin12345';
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    email: overrides.email || 'admin.test@coconexus.local',
    password: hashedPassword,
    role: 'admin',
  });

  await UserProfile.create({
    user_id: user.id,
    full_name: overrides.full_name || 'Admin Test COCONEXUS',
    bio: 'Test admin',
    avatar_url: null,
    job_title: overrides.job_title || 'Koordinator Konten',
    department: overrides.department || 'Manajemen Artikel',
    division: overrides.division || 'Artikel Utama',
  });

  return {
    user,
    plainPassword: password,
  };
}

async function createPengelolaUser(overrides = {}) {
  const password = overrides.password || 'Pengelola123';
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    email: overrides.email || 'pengelola.test@coconexus.local',
    password: hashedPassword,
    role: 'pengelola',
  });

  await UserProfile.create({
    user_id: user.id,
    full_name: overrides.full_name || 'Pengelola Test COCONEXUS',
    bio: 'Test pengelola',
    avatar_url: null,
    job_title: overrides.job_title || 'Penulis Artikel',
    department: overrides.department || 'Produksi Konten',
    division: overrides.division || 'Artikel Utama',
  });

  return {
    user,
    plainPassword: password,
  };
}

module.exports = {
  resetTestDatabase,
  createAdminUser,
  createPengelolaUser,
};
