'use strict';

const bcrypt = require('bcryptjs');
const { sequelize, User, UserProfile } = require('../../models');

async function resetTestDatabase() {
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
  });

  return {
    user,
    plainPassword: password,
  };
}

module.exports = {
  resetTestDatabase,
  createAdminUser,
};
