'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    const sampleUsers = [
      {
        email: 'pengelola.editor@coconexus.local',
        password: 'Pengelola12345',
        role: 'pengelola',
        profile: {
          full_name: 'Fitria Susanti',
          bio: 'Editor konten yang fokus pada kurasi artikel dan proses review editorial.',
          job_title: 'Editor Konten',
          department: 'Editorial',
          division: 'Konten',
        },
      },
      {
        email: 'pengelola.publikasi@coconexus.local',
        password: 'Pengelola12345',
        role: 'pengelola',
        profile: {
          full_name: 'Rizki Wardana',
          bio: 'Koordinator publikasi yang menangani distribusi dan sosial media.',
          job_title: 'Koordinator Publikasi',
          department: 'Komunikasi',
          division: 'Publikasi',
        },
      },
      {
        email: 'pengelola.komunitas@coconexus.local',
        password: 'Pengelola12345',
        role: 'pengelola',
        profile: {
          full_name: 'Maya Nurul',
          bio: 'Manajer komunitas yang mengelola hubungan pembaca dan stakeholder.',
          job_title: 'Manajer Komunitas',
          department: 'Community',
          division: 'Engagement',
        },
      },
      {
        email: 'pengelola.data@coconexus.local',
        password: 'Pengelola12345',
        role: 'pengelola',
        profile: {
          full_name: 'Andi Taufik',
          bio: 'Analis data editorial yang mengawasi performa konten dan insight pembaca.',
          job_title: 'Analis Data',
          department: 'Data',
          division: 'Insight',
        },
      },
    ];

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
        job_title: sample.profile.job_title,
        department: sample.profile.department,
        division: sample.profile.division,
      };
    });

    if (profileRecords.length > 0) {
      await queryInterface.bulkInsert('UserProfile', profileRecords, {
        ignoreDuplicates: true,
      });
    }
  },

  async down(queryInterface) {
    const emails = [
      'pengelola.editor@coconexus.local',
      'pengelola.publikasi@coconexus.local',
      'pengelola.komunitas@coconexus.local',
      'pengelola.data@coconexus.local',
    ];

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
