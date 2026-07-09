'use strict';

/**
 * Seeds operational accounts:
 * - 1 pengelola (job_title is informational only, does not affect access)
 * - 4 moderators, one per moderator_type (content, publication, forum, tag)
 *
 * Admin account is seeded separately by 20260421000800-seed-default-admin.js
 */

const bcrypt = require('bcryptjs');
const { MODERATOR_TYPE_LABELS } = require('../utils/accessControl');

const ACCOUNTS = [
  {
    email: 'pengelola@coconexus.local',
    password: 'Pengelola12345',
    role: 'pengelola',
    profile: {
      full_name: 'Pengelola COCONEXUS',
      bio: 'Akun operasional pengelola konten COCONEXUS.',
      job_title: 'Editor Konten',
      department: 'Redaksi',
      division: 'Artikel Utama',
    },
  },
  {
    email: 'moderator.konten@coconexus.local',
    password: 'Moderator12345',
    role: 'moderator',
    moderator_type: 'content',
    profile: {
      full_name: `${MODERATOR_TYPE_LABELS.content} COCONEXUS`,
      bio: 'Bertugas meninjau kualitas dan kepatuhan naskah artikel sebelum publikasi.',
      job_title: MODERATOR_TYPE_LABELS.content,
      department: 'Redaksi',
      division: 'Artikel Utama',
    },
  },
  {
    email: 'moderator.publikasi@coconexus.local',
    password: 'Moderator12345',
    role: 'moderator',
    moderator_type: 'publication',
    profile: {
      full_name: `${MODERATOR_TYPE_LABELS.publication} COCONEXUS`,
      bio: 'Bertugas memvalidasi versi artikel dan menerbitkannya ke publik.',
      job_title: MODERATOR_TYPE_LABELS.publication,
      department: 'Validasi & Publikasi',
      division: 'Artikel Detail',
    },
  },
  {
    email: 'moderator.forum@coconexus.local',
    password: 'Moderator12345',
    role: 'moderator',
    moderator_type: 'forum',
    profile: {
      full_name: `${MODERATOR_TYPE_LABELS.forum} COCONEXUS`,
      bio: 'Bertugas mengelola komentar dan forum diskusi agar tetap relevan dan aman.',
      job_title: MODERATOR_TYPE_LABELS.forum,
      department: 'Produksi Konten',
      division: 'Artikel Utama',
    },
  },
  {
    email: 'moderator.tag@coconexus.local',
    password: 'Moderator12345',
    role: 'moderator',
    moderator_type: 'tag',
    profile: {
      full_name: `${MODERATOR_TYPE_LABELS.tag} COCONEXUS`,
      bio: 'Bertugas mengawasi konsistensi taksonomi kategori dan tag konten.',
      job_title: MODERATOR_TYPE_LABELS.tag,
      department: 'Kategori & Tag',
      division: 'Kategori',
    },
  },
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const moderatorAssignmentTable = await queryInterface.describeTable('ModeratorAssignment').catch(() => null);

    for (const account of ACCOUNTS) {
      const [existing] = await queryInterface.sequelize.query(
        'SELECT id FROM `User` WHERE email = :email LIMIT 1',
        { replacements: { email: account.email } }
      );

      let userId;

      if (existing.length === 0) {
        const hashedPassword = await bcrypt.hash(account.password, 12);
        await queryInterface.bulkInsert('User', [
          {
            email: account.email,
            password: hashedPassword,
            role: account.role,
            created_at: now,
            updated_at: now,
            deleted_at: null,
          },
        ]);

        const [inserted] = await queryInterface.sequelize.query(
          'SELECT id FROM `User` WHERE email = :email LIMIT 1',
          { replacements: { email: account.email } }
        );
        userId = inserted[0].id;
      } else {
        userId = existing[0].id;
      }

      const profileData = {
        full_name: account.profile.full_name,
        bio: account.profile.bio,
        avatar_url: null,
        job_title: account.profile.job_title,
        department: account.profile.department,
        division: account.profile.division,
      };

      const [existingProfile] = await queryInterface.sequelize.query(
        'SELECT user_id FROM `UserProfile` WHERE user_id = :user_id LIMIT 1',
        { replacements: { user_id: userId } }
      );

      if (existingProfile.length === 0) {
        await queryInterface.bulkInsert('UserProfile', [{ user_id: userId, ...profileData }]);
      } else {
        await queryInterface.bulkUpdate('UserProfile', profileData, { user_id: userId });
      }

      if (moderatorAssignmentTable && account.role === 'moderator' && account.moderator_type) {
        const [existingAssignment] = await queryInterface.sequelize.query(
          'SELECT user_id FROM `ModeratorAssignment` WHERE user_id = :user_id LIMIT 1',
          { replacements: { user_id: userId } }
        );

        if (existingAssignment.length === 0) {
          await queryInterface.bulkInsert('ModeratorAssignment', [
            {
              user_id: userId,
              moderator_type: account.moderator_type,
              assigned_by: null,
              created_at: now,
              updated_at: now,
            },
          ]);
        } else {
          await queryInterface.bulkUpdate(
            'ModeratorAssignment',
            { moderator_type: account.moderator_type, updated_at: now },
            { user_id: userId }
          );
        }
      }
    }
  },

  async down(queryInterface) {
    const emails = ACCOUNTS.map((a) => a.email);

    const [users] = await queryInterface.sequelize.query(
      'SELECT id FROM `User` WHERE email IN (:emails)',
      { replacements: { emails } }
    );

    if (users.length > 0) {
      const ids = users.map((row) => row.id);
      await queryInterface.bulkDelete('ModeratorAssignment', { user_id: ids });
      await queryInterface.bulkDelete('UserProfile', { user_id: ids });
      await queryInterface.bulkDelete('User', { id: ids });
    }
  },
};
