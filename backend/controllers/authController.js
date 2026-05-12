'use strict';

const bcrypt = require('bcryptjs');
const { User, UserProfile, sequelize } = require('../models');
const { generateToken } = require('../utils/jwt');
const { badRequest, conflict, unauthorized } = require('../utils/httpErrors');
const { sanitizeUser } = require('../utils/serializers');
const { isValidEmail, isStrongPassword, normalizeEmail, isNonEmptyString } = require('../utils/validators');

async function register(req, res, next) {
  const transaction = await sequelize.transaction();

  try {
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;
    const fullName = typeof req.body.full_name === 'string' ? req.body.full_name.trim() : '';
    const bio = isNonEmptyString(req.body.bio) ? req.body.bio.trim() : null;
    const avatarUrl = isNonEmptyString(req.body.avatar_url) ? req.body.avatar_url.trim() : null;
    const role = 'user';

    if (!isValidEmail(email)) {
      throw badRequest('Email tidak valid.');
    }

    if (!isStrongPassword(password)) {
      throw badRequest('Password minimal 8 karakter dan harus mengandung huruf serta angka.');
    }

    if (!isNonEmptyString(fullName)) {
      throw badRequest('full_name wajib diisi.');
    }

    const existingUser = await User.findOne({
      where: { email },
      paranoid: false,
      transaction,
    });

    if (existingUser && !existingUser.deletedAt) {
      throw conflict('Email sudah terdaftar.');
    }

    if (existingUser && existingUser.deletedAt) {
      throw conflict('Email tersebut sudah pernah digunakan dan akun telah dihapus.');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create(
      {
        email,
        password: hashedPassword,
        role,
      },
      { transaction }
    );

    await UserProfile.create(
      {
        user_id: user.id,
        full_name: fullName,
        bio,
        avatar_url: avatarUrl,
      },
      { transaction }
    );

    await transaction.commit();

    const createdUser = await User.findByPk(user.id, {
      include: [
        {
          model: UserProfile,
          as: 'profile',
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: 'Registrasi berhasil.',
      data: {
        user: sanitizeUser(createdUser),
      },
    });
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;

    if (!isValidEmail(email)) {
      throw badRequest('Email tidak valid.');
    }

    if (!isNonEmptyString(password)) {
      throw badRequest('Password wajib diisi.');
    }

    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: UserProfile,
          as: 'profile',
        },
      ],
    });

    if (!user) {
      throw unauthorized('Email atau password salah.');
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      throw unauthorized('Email atau password salah.');
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return res.status(200).json({
      success: true,
      message: 'Login berhasil.',
      data: {
        token,
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  login,
};
