'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@coconexus.local';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin12345';
    const adminFullName = process.env.ADMIN_FULL_NAME || 'Administrator COCONEXUS';

    const [existingUsers] = await queryInterface.sequelize.query(
      'SELECT id FROM `User` WHERE email = :email LIMIT 1',
      {
        replacements: { email: adminEmail },
      }
    );

    if (existingUsers.length > 0) {
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    const now = new Date();

    await queryInterface.bulkInsert('User', [
      {
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
    ]);

    const [insertedUsers] = await queryInterface.sequelize.query(
      'SELECT id FROM `User` WHERE email = :email LIMIT 1',
      {
        replacements: { email: adminEmail },
      }
    );

    if (insertedUsers.length === 0) {
      return;
    }

    await queryInterface.bulkInsert('UserProfile', [
      {
        user_id: insertedUsers[0].id,
        full_name: adminFullName,
        bio: 'Akun admin default untuk bootstrap sistem COCONEXUS.',
        avatar_url: null,
      },
    ]);
  },

  async down(queryInterface) {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@coconexus.local';

    const [existingUsers] = await queryInterface.sequelize.query(
      'SELECT id FROM `User` WHERE email = :email LIMIT 1',
      {
        replacements: { email: adminEmail },
      }
    );

    if (existingUsers.length === 0) {
      return;
    }

    await queryInterface.bulkDelete('UserProfile', {
      user_id: existingUsers[0].id,
    });

    await queryInterface.bulkDelete('User', {
      email: adminEmail,
    });
  },
};
