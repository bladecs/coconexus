'use strict';

const { User, UserProfile, ModeratorAssignment } = require('../models');
const { unauthorized } = require('../utils/httpErrors');
const { verifyToken } = require('../utils/jwt');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw unauthorized('Token autentikasi tidak ditemukan.');
    }

    const token = authHeader.slice(7).trim();
    const payload = verifyToken(token);

    const user = await User.findByPk(payload.id, {
      include: [
        {
          model: UserProfile,
          as: 'profile',
        },
        {
          model: ModeratorAssignment,
          as: 'moderatorAssignment',
        },
      ],
    });

    if (!user) {
      throw unauthorized('User untuk token ini tidak ditemukan.');
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

async function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.slice(7).trim();
    const payload = verifyToken(token);

    const user = await User.findByPk(payload.id, {
      include: [
        {
          model: UserProfile,
          as: 'profile',
        },
        {
          model: ModeratorAssignment,
          as: 'moderatorAssignment',
        },
      ],
    });

    if (user) {
      req.user = user;
    }

    return next();
  } catch {
    return next();
  }
}

module.exports = {
  authenticate,
  optionalAuthenticate,
};
