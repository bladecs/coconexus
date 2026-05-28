'use strict';

const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User, UserProfile, sequelize } = require('../models');
const { badRequest, notFound, conflict, forbidden } = require('../utils/httpErrors');
const { sanitizeUser } = require('../utils/serializers');
const { isValidEmail, normalizeEmail, isNonEmptyString, isStrongPassword } = require('../utils/validators');
const { writeAuditLog } = require('../utils/auditLogger');

async function updateMyProfile(req, res, next) {
  try {
    const fullName = typeof req.body.full_name === 'string' ? req.body.full_name.trim() : '';
    const bio = req.body.bio === undefined ? undefined : (isNonEmptyString(req.body.bio) ? req.body.bio.trim() : null);
    const avatarUrl = req.body.avatar_url === undefined ? undefined : (isNonEmptyString(req.body.avatar_url) ? req.body.avatar_url.trim() : null);

    if (!isNonEmptyString(fullName)) {
      throw badRequest('full_name wajib diisi.');
    }

    const profile = await UserProfile.findOne({
      where: { user_id: req.user.id },
    });

    if (!profile) {
      throw notFound('Profil user tidak ditemukan.');
    }

    profile.full_name = fullName;

    if (bio !== undefined) {
      profile.bio = bio;
    }

    if (avatarUrl !== undefined) {
      profile.avatar_url = avatarUrl;
    }

    await profile.save();

    const user = await User.findByPk(req.user.id, {
      include: [
        {
          model: UserProfile,
          as: 'profile',
        },
      ],
    });

    return res.status(200).json({
      success: true,
      message: 'Profil berhasil diperbarui.',
      data: {
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function listUsers(req, res, next) {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 50);
    const offset = (page - 1) * limit;
    const where = search
      ? {
          [Op.or]: [
            { email: { [Op.like]: `%${search}%` } },
            { '$profile.full_name$': { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

    const { rows: users, count } = await User.findAndCountAll({
      where,
      include: [
        {
          model: UserProfile,
          as: 'profile',
        },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    return res.status(200).json({
      success: true,
      message: 'Daftar user berhasil diambil.',
      data: {
        users: users.map(sanitizeUser),
        meta: {
          page,
          limit,
          total_items: count,
          total_pages: Math.ceil(count / limit),
          search,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getUserById(req, res, next) {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      throw badRequest('Parameter user id tidak valid.');
    }

    const user = await User.findByPk(userId, {
      include: [
        {
          model: UserProfile,
          as: 'profile',
        },
      ],
    });

    if (!user) {
      throw notFound('User tidak ditemukan.');
    }

    return res.status(200).json({
      success: true,
      message: 'Detail user berhasil diambil.',
      data: {
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function createUser(req, res, next) {
  const transaction = await sequelize.transaction();

  try {
    const email = normalizeEmail(req.body.email || '');
    const password = req.body.password || '';
    const role = typeof req.body.role === 'string' ? req.body.role.trim().toLowerCase() : 'user';
    const fullName = typeof req.body.full_name === 'string' ? req.body.full_name.trim() : '';
    const jobTitle = typeof req.body.job_title === 'string' ? req.body.job_title.trim() : null;
    const department = typeof req.body.department === 'string' ? req.body.department.trim() : null;
    const division = typeof req.body.division === 'string' ? req.body.division.trim() : null;

    if (!isValidEmail(email)) {
      throw badRequest('Email tidak valid.');
    }

    if (!isStrongPassword(password)) {
      throw badRequest('Password minimal 8 karakter dan harus mengandung huruf serta angka.');
    }

    if (!['admin', 'pengelola', 'user'].includes(role)) {
      throw badRequest('Role hanya boleh admin, pengelola, atau user.');
    }

    const existing = await User.findOne({ where: { email }, transaction });
    if (existing) {
      throw conflict('Email sudah terdaftar.');
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await User.create(
      {
        email,
        password: hashed,
        role,
      },
      { transaction }
    );

    await UserProfile.create(
      {
        user_id: user.id,
        full_name: fullName || email.split('@')[0],
        job_title: jobTitle,
        department,
        division,
      },
      { transaction }
    );

    await transaction.commit();

    const created = await User.findByPk(user.id, {
      include: [{ model: UserProfile, as: 'profile' }],
    });

    return res.status(201).json({
      success: true,
      message: 'User berhasil dibuat.',
      data: { user: sanitizeUser(created) },
    });
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
}

async function adminUpdateUser(req, res, next) {
  const transaction = await sequelize.transaction();

  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      throw badRequest('Parameter user id tidak valid.');
    }

    const user = await User.findByPk(userId, {
      include: [
        {
          model: UserProfile,
          as: 'profile',
        },
      ],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!user) {
      throw notFound('User tidak ditemukan.');
    }

    if (req.body.email !== undefined) {
      const email = normalizeEmail(req.body.email);

      if (!isValidEmail(email)) {
        throw badRequest('Email tidak valid.');
      }

      const existingUser = await User.findOne({
        where: { email },
        transaction,
      });

      if (existingUser && existingUser.id !== user.id) {
        throw conflict('Email sudah digunakan user lain.');
      }

      user.email = email;
    }

    if (req.body.role !== undefined) {
      const role = typeof req.body.role === 'string' ? req.body.role.trim().toLowerCase() : '';

      if (!['admin', 'pengelola', 'user'].includes(role)) {
        throw badRequest('Role hanya boleh admin, pengelola, atau user.');
      }

      user.role = role;
    }

    if (req.body.password !== undefined) {
      if (!isStrongPassword(req.body.password)) {
        throw badRequest('Password minimal 8 karakter dan harus mengandung huruf serta angka.');
      }

      user.password = await bcrypt.hash(req.body.password, 12);
    }

    await user.save({ transaction });

    const profilePayload = req.body.profile || {};
    const shouldUpdateProfile =
      req.body.full_name !== undefined ||
      req.body.bio !== undefined ||
      req.body.avatar_url !== undefined ||
      req.body.job_title !== undefined ||
      req.body.department !== undefined ||
      req.body.division !== undefined ||
      Object.keys(profilePayload).length > 0;

    if (shouldUpdateProfile) {
      if (!user.profile) {
        throw notFound('Profil user tidak ditemukan.');
      }

      const fullName =
        profilePayload.full_name !== undefined ? profilePayload.full_name : req.body.full_name;
      const bio =
        profilePayload.bio !== undefined ? profilePayload.bio : req.body.bio;
      const avatarUrl =
        profilePayload.avatar_url !== undefined ? profilePayload.avatar_url : req.body.avatar_url;
      const jobTitle =
        profilePayload.job_title !== undefined ? profilePayload.job_title : req.body.job_title;
      const department =
        profilePayload.department !== undefined ? profilePayload.department : req.body.department;
      const division =
        profilePayload.division !== undefined ? profilePayload.division : req.body.division;

      if (fullName !== undefined) {
        const normalizedFullName = typeof fullName === 'string' ? fullName.trim() : '';

        if (!isNonEmptyString(normalizedFullName)) {
          throw badRequest('full_name tidak boleh kosong.');
        }

        user.profile.full_name = normalizedFullName;
      }

      if (bio !== undefined) {
        user.profile.bio = isNonEmptyString(bio) ? bio.trim() : null;
      if (jobTitle !== undefined) {
        user.profile.job_title = isNonEmptyString(jobTitle) ? jobTitle.trim() : null;
      }

      if (department !== undefined) {
        user.profile.department = isNonEmptyString(department) ? department.trim() : null;
      }

      if (division !== undefined) {
        user.profile.division = isNonEmptyString(division) ? division.trim() : null;
      }

      }

      if (avatarUrl !== undefined) {
        user.profile.avatar_url = isNonEmptyString(avatarUrl) ? avatarUrl.trim() : null;
      }

      await user.profile.save({ transaction });
    }

    await transaction.commit();

    const updatedUser = await User.findByPk(userId, {
      include: [
        {
          model: UserProfile,
          as: 'profile',
        },
      ],
    });

    await writeAuditLog({
      actorId: req.user.id,
      action: 'admin.update_user',
      entityType: 'user',
      entityId: updatedUser.id,
      metadata: {
        target_email: updatedUser.email,
        role: updatedUser.role,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Data user berhasil diperbarui.',
      data: {
        user: sanitizeUser(updatedUser),
      },
    });
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
}

async function adminSoftDeleteUser(req, res, next) {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      throw badRequest('Parameter user id tidak valid.');
    }

    if (req.user.id === userId) {
      throw forbidden('Admin tidak dapat menghapus akunnya sendiri.');
    }

    const user = await User.findByPk(userId);

    if (!user) {
      throw notFound('User tidak ditemukan.');
    }

    await user.destroy();

    await writeAuditLog({
      actorId: req.user.id,
      action: 'admin.soft_delete_user',
      entityType: 'user',
      entityId: userId,
      metadata: {
        target_email: user.email,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'User berhasil di-soft delete.',
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  updateMyProfile,
  listUsers,
  getUserById,
  adminUpdateUser,
  adminSoftDeleteUser,
  createUser,
};
