'use strict';

/**
 * Seeds one sample pengelola account with realistic profile data for demos.
 *
 * Moderator accounts (moderator.konten@, moderator.publikasi@, moderator.forum@,
 * moderator.tag@coconexus.local) are owned exclusively by
 * 20260625000100-seed-role-accounts.js — do not add them here too. Both seeders
 * previously targeted the same 4 emails, so whichever ran last silently overwrote
 * the other's profile data (full_name/job_title) on every fresh seed.
 */

const bcrypt = require('bcryptjs');

const sampleUsers = [
  {
    email: 'pengelola.editor@coconexus.local',
    password: 'Pengelola12345',
    role: 'pengelola',
    profile: {
      full_name: 'Fitria Susanti',
      bio: 'Editor konten yang fokus pada kurasi artikel dan proses review editorial.',
      department: 'Editorial',
      division: 'Konten',
    },
  },
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const userRecords = [];

    for (const user of sampleUsers) {
      const [existing] = await queryInterface.sequelize.query(
        'SELECT id FROM `User` WHERE email = :email LIMIT 1',
        {
          replacements: { email: user.email },
        }
      );

      if (existing.length === 0) {
        const hashedPassword = await bcrypt.hash(user.password, 12);
        userRecords.push({
          email: user.email,
          password: hashedPassword,
          role: user.role,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        });
      }
    }

    if (userRecords.length > 0) {
      await queryInterface.bulkInsert('User', userRecords);
    }

    const emails = sampleUsers.map((user) => user.email);
    const [insertedUsers] = await queryInterface.sequelize.query(
      'SELECT id, email FROM `User` WHERE email IN (:emails)',
      {
        replacements: { emails },
      }
    );

    const profileRecords = insertedUsers.map((row) => {
      const sample = sampleUsers.find((item) => item.email === row.email);
      return {
        user_id: row.id,
        full_name: sample.profile.full_name,
        bio: sample.profile.bio,
        avatar_url: null,
        job_title: sample.profile.job_title ?? null,
        department: sample.profile.department,
        division: sample.profile.division,
      };
    });

    for (const profile of profileRecords) {
      const [existingProfile] = await queryInterface.sequelize.query(
        'SELECT user_id FROM `UserProfile` WHERE user_id = :user_id LIMIT 1',
        { replacements: { user_id: profile.user_id } }
      );

      if (existingProfile.length === 0) {
        await queryInterface.bulkInsert('UserProfile', [profile]);
        continue;
      }

      await queryInterface.bulkUpdate(
        'UserProfile',
        {
          full_name: profile.full_name,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
          job_title: profile.job_title,
          department: profile.department,
          division: profile.division,
        },
        { user_id: profile.user_id }
      );
    }
  },

  async down(queryInterface) {
    const emails = sampleUsers.map((user) => user.email);

    const [users] = await queryInterface.sequelize.query(
      'SELECT id FROM `User` WHERE email IN (:emails)',
      {
        replacements: { emails },
      }
    );

    if (users.length > 0) {
      const ids = users.map((row) => row.id);
      await queryInterface.bulkDelete('UserProfile', {
        user_id: ids,
      });
      await queryInterface.bulkDelete('User', {
        id: ids,
      });
    }
  },
};
