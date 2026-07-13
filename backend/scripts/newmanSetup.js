'use strict';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-coconexus';
process.env.RATE_LIMIT_MAX_REQUESTS = process.env.RATE_LIMIT_MAX_REQUESTS || '10000';
process.env.AUTH_RATE_LIMIT_MAX_REQUESTS = process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '10000';

const bcrypt = require('bcryptjs');
const { sequelize, User, UserProfile, ModeratorAssignment } = require('../models');

async function main() {
  await sequelize.sync({ force: true });

  const adminPassword = await bcrypt.hash('Admin12345', 12);
  const admin = await User.create({
    email: 'admin.newman@coconexus.local',
    password: adminPassword,
    role: 'admin',
  });

  await UserProfile.create({
    user_id: admin.id,
    full_name: 'Admin Newman',
    bio: 'Akun admin untuk pengujian API Newman.',
    avatar_url: null,
  });

  const pengelolaPassword = await bcrypt.hash('Pengelola12345', 12);
  const pengelola = await User.create({
    email: 'pengelola.newman@coconexus.local',
    password: pengelolaPassword,
    role: 'pengelola',
  });

  await UserProfile.create({
    user_id: pengelola.id,
    full_name: 'Pengelola Newman',
    bio: 'Akun pengelola untuk pengujian API Newman (monitoring, read-only).',
    avatar_url: null,
    job_title: 'Penulis Artikel',
    department: 'Produksi Konten',
    division: 'Artikel Utama',
  });

  const contentModeratorPassword = await bcrypt.hash('KuratorKonten12345', 12);
  const contentModerator = await User.create({
    email: 'kurator.newman@coconexus.local',
    password: contentModeratorPassword,
    role: 'moderator',
  });

  await UserProfile.create({
    user_id: contentModerator.id,
    full_name: 'Kurator Konten Newman',
    bio: 'Akun Kurator Konten untuk pengujian API Newman.',
    avatar_url: null,
  });

  await ModeratorAssignment.create({
    user_id: contentModerator.id,
    moderator_type: 'content',
  });

  const publicationModeratorPassword = await bcrypt.hash('RedakturPublikasi12345', 12);
  const publicationModerator = await User.create({
    email: 'redaktur.newman@coconexus.local',
    password: publicationModeratorPassword,
    role: 'moderator',
  });

  await UserProfile.create({
    user_id: publicationModerator.id,
    full_name: 'Redaktur Publikasi Newman',
    bio: 'Akun Redaktur Publikasi untuk pengujian API Newman.',
    avatar_url: null,
  });

  await ModeratorAssignment.create({
    user_id: publicationModerator.id,
    moderator_type: 'publication',
  });

  const tagModeratorPassword = await bcrypt.hash('PenataTaksonomi12345', 12);
  const tagModerator = await User.create({
    email: 'penata.newman@coconexus.local',
    password: tagModeratorPassword,
    role: 'moderator',
  });

  await UserProfile.create({
    user_id: tagModerator.id,
    full_name: 'Penata Taksonomi Newman',
    bio: 'Akun Penata Taksonomi untuk pengujian API Newman.',
    avatar_url: null,
  });

  await ModeratorAssignment.create({
    user_id: tagModerator.id,
    moderator_type: 'tag',
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
