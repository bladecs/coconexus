'use strict';

const bcrypt = require('bcryptjs');
const { sequelize, User, UserProfile } = require('../../models');

async function resetTestDatabase() {
  // reset test database tanpa mengandalkan sequelize.sync({force:true})
  // karena pada MySQL ada FK constraint antar tabel join.

  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

  // Drop tabel join yang memicu FK terlebih dahulu.
  // Error Anda mengarah ke constraint: articlecategorytag_ibfk_1 pada tabel articlecategorytag.
  // Jadi pastikan tabel itu dibuang dulu.
  await sequelize.query('DROP TABLE IF EXISTS `articlecategorytag`');

  // Beberapa project memakai nama lain untuk join table.
  // Drop dengan beberapa kemungkinan yang umum.
  await sequelize.query('DROP TABLE IF EXISTS `ArticleCategoryTag`');

  // Drop tabel utama lalu sisanya.
  // Urutan ini menghindari kasus parent table (article) masih direfer oleh join.
  await sequelize.query('DROP TABLE IF EXISTS `ArticleView`');
  await sequelize.query('DROP TABLE IF EXISTS `articleview`');

  await sequelize.query('DROP TABLE IF EXISTS `ProductCard`');
  await sequelize.query('DROP TABLE IF EXISTS `productcard`');

  await sequelize.query('DROP TABLE IF EXISTS `ArticleDetail`');
  await sequelize.query('DROP TABLE IF EXISTS `articledetail`');

  await sequelize.query('DROP TABLE IF EXISTS `ArticleView`');
  await sequelize.query('DROP TABLE IF EXISTS `articleview`');

  await sequelize.query('DROP TABLE IF EXISTS `Comment`');
  await sequelize.query('DROP TABLE IF EXISTS `comment`');

  await sequelize.query('DROP TABLE IF EXISTS `ArticleMedia`');
  await sequelize.query('DROP TABLE IF EXISTS `articlemedia`');

  await sequelize.query('DROP TABLE IF EXISTS `article`');
  await sequelize.query('DROP TABLE IF EXISTS `Article`');


  // Drop tabel lain yang diregistrasi oleh sequelize.
  const modelTables = Object.values(sequelize.models)
    .map((m) => m && m.getTableName && m.getTableName())
    .flat();

  for (const tableDef of modelTables) {
    if (!tableDef) continue;
    const tableName = typeof tableDef === 'string' ? tableDef : tableDef.tableName || tableDef.name;
    if (!tableName) continue;

    await sequelize.query(`DROP TABLE IF EXISTS \`${tableName}\``);
  }

  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

  // Buat ulang schema dari models
  await sequelize.sync();
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
