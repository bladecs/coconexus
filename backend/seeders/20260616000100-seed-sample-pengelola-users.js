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
          department: 'Editorial',
          division: 'Konten',
        },
      },
      {
        email: 'moderator.konten@coconexus.local',
        password: 'Moderator12345',
        role: 'moderator',
        moderator_type: 'content',
        profile: {
          full_name: 'Dimas Prakoso',
          bio: 'Moderator konten yang fokus pada review kualitas dan kepatuhan naskah.',
          job_title: 'Moderator Konten',
          department: 'Editorial',
          division: 'Moderasi Konten',
        },
      },
      {
        email: 'moderator.publikasi@coconexus.local',
        password: 'Moderator12345',
        role: 'moderator',
        moderator_type: 'publication',
        profile: {
          full_name: 'Nadia Maharani',
          bio: 'Moderator publikasi yang memeriksa kesiapan artikel sebelum tayang.',
          job_title: 'Moderator Publikasi',
          department: 'Komunikasi',
          division: 'Moderasi Publikasi',
        },
      },
      {
        email: 'moderator.forum@coconexus.local',
        password: 'Moderator12345',
        role: 'moderator',
        moderator_type: 'forum',
        profile: {
          full_name: 'Rama Saputra',
          bio: 'Moderator forum yang menjaga diskusi tetap aman dan relevan.',
          job_title: 'Moderator Forum',
          department: 'Community',
          division: 'Moderasi Forum',
        },
      },
      {
        email: 'moderator.tag@coconexus.local',
        password: 'Moderator12345',
        role: 'moderator',
        moderator_type: 'tag',
        profile: {
          full_name: 'Salsa Wibowo',
          bio: 'Moderator tag yang memastikan taksonomi konten tetap rapi dan konsisten.',
          job_title: 'Moderator Tag',
          department: 'Taxonomy',
          division: 'Moderasi Tag',
        },
      },
    ];

    const now = new Date();
    const userRecords = [];
    const moderatorAssignmentTable = await queryInterface.describeTable('ModeratorAssignment').catch(() => null);

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

    if (moderatorAssignmentTable) {
      for (const row of insertedUsers) {
        const sample = sampleUsers.find((item) => item.email === row.email);
        if (sample.role !== 'moderator' || !sample.moderator_type) {
          continue;
        }

        const [existingAssignment] = await queryInterface.sequelize.query(
          'SELECT user_id FROM `ModeratorAssignment` WHERE user_id = :user_id LIMIT 1',
          { replacements: { user_id: row.id } }
        );

        const assignmentPayload = {
          moderator_type: sample.moderator_type,
          assigned_by: null,
          created_at: now,
          updated_at: now,
        };

        if (existingAssignment.length === 0) {
          await queryInterface.bulkInsert('ModeratorAssignment', [
            {
              user_id: row.id,
              ...assignmentPayload,
            },
          ]);
          continue;
        }

        await queryInterface.bulkUpdate(
          'ModeratorAssignment',
          {
            moderator_type: assignmentPayload.moderator_type,
            assigned_by: assignmentPayload.assigned_by,
            updated_at: assignmentPayload.updated_at,
          },
          { user_id: row.id }
        );
      }
    }
  },

  async down(queryInterface) {
    const emails = [
      'pengelola.editor@coconexus.local',
      'pengelola.publikasi@coconexus.local',
      'pengelola.komunitas@coconexus.local',
      'pengelola.data@coconexus.local',
      'moderator.konten@coconexus.local',
      'moderator.publikasi@coconexus.local',
      'moderator.forum@coconexus.local',
      'moderator.tag@coconexus.local',
    ];

    const [users] = await queryInterface.sequelize.query(
      'SELECT id FROM `User` WHERE email IN (:emails)',
      {
        replacements: { emails },
      }
    );

    if (users.length > 0) {
      const ids = users.map((row) => row.id);
      await queryInterface.bulkDelete('ModeratorAssignment', {
        user_id: ids,
      });
      await queryInterface.bulkDelete('UserProfile', {
        user_id: ids,
      });
      await queryInterface.bulkDelete('User', {
        id: ids,
      });
    }
  },
};
