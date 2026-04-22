'use strict';

const path = require('path');
const { User, UserProfile } = require('../models');
const { badRequest } = require('../utils/httpErrors');
const { sanitizeUser } = require('../utils/serializers');

function inferMediaType(mimetype) {
  if (mimetype.startsWith('image/')) {
    return 'image';
  }

  if (mimetype.startsWith('video/')) {
    return 'video';
  }

  return 'document';
}

async function uploadArticleMediaFile(req, res, next) {
  try {
    if (!req.file) {
      throw badRequest('File media wajib diunggah.');
    }

    return res.status(201).json({
      success: true,
      message: 'File media berhasil diunggah.',
      data: {
        media: {
          original_name: req.file.originalname,
          file_name: req.file.filename,
          file_path: `/uploads/articles/${req.file.filename}`,
          absolute_path: req.file.path,
          file_size: req.file.size,
          mime_type: req.file.mimetype,
          extension: path.extname(req.file.originalname || '').toLowerCase(),
          media_type: inferMediaType(req.file.mimetype),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function uploadMyAvatar(req, res, next) {
  try {
    if (!req.file) {
      throw badRequest('File avatar wajib diunggah.');
    }

    const profile = await UserProfile.findOne({
      where: { user_id: req.user.id },
    });

    if (!profile) {
      throw badRequest('Profil user tidak ditemukan.');
    }

    profile.avatar_url = `/uploads/avatars/${req.file.filename}`;
    await profile.save();

    const user = await User.findByPk(req.user.id, {
      include: [
        {
          model: UserProfile,
          as: 'profile',
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: 'Avatar berhasil diunggah.',
      data: {
        avatar_url: profile.avatar_url,
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  uploadArticleMediaFile,
  uploadMyAvatar,
};
