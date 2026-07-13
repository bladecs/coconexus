'use strict';

const { forbidden } = require('../utils/httpErrors');
const {
  hasModeratorScope,
  normalizeModeratorType,
} = require('../utils/accessControl');

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(forbidden('User belum terautentikasi.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(forbidden('Anda tidak memiliki akses ke resource ini.'));
    }

    return next();
  };
}

function authorizeArticleAuthors() {
  return (req, res, next) => {
    if (!req.user) {
      return next(forbidden('User belum terautentikasi.'));
    }

    if (req.user.role === 'admin') {
      return next();
    }

    if (hasModeratorScope(req.user, 'content')) {
      return next();
    }

    if (req.user.role === 'user' && req.user.profile?.contributor_status === 'approved') {
      return next();
    }

    return next(forbidden('Anda tidak memiliki akses ke resource ini.'));
  };
}

function authorizeModeratorScopes(...allowedScopes) {
  return (req, res, next) => {
    if (!req.user) {
      return next(forbidden('User belum terautentikasi.'));
    }

    if (!hasModeratorScope(req.user, ...allowedScopes.map(normalizeModeratorType))) {
      return next(forbidden('Moderator tidak memiliki scope akses ke resource ini.'));
    }

    return next();
  };
}

function authorizeContributor() {
  return (req, res, next) => {
    if (!req.user) {
      return next(forbidden('User belum terautentikasi.'));
    }

    if (req.user.role !== 'user') {
      return next(forbidden('Fitur ini hanya untuk akun pengguna biasa.'));
    }

    const status = req.user.profile?.contributor_status;
    if (status !== 'approved') {
      return next(forbidden('Akun Anda belum diverifikasi sebagai kontributor.'));
    }

    return next();
  };
}

module.exports = {
  authorize,
  authorizeArticleAuthors,
  authorizeModeratorScopes,
  authorizeContributor,
};
