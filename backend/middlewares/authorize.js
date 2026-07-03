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

function authorizeJobs(...allowedJobs) {
  return (req, res, next) => {
    if (!req.user) {
      return next(forbidden('User belum terautentikasi.'));
    }

    // allowedJobs dipertahankan agar route lama tetap kompatibel,
    // namun akses pengelola sekarang ditentukan oleh role saja.
    if (req.user.role !== 'pengelola') {
      return next(forbidden('Anda tidak memiliki akses ke resource ini.'));
    }

    return next();
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
  authorizeJobs,
  authorizeModeratorScopes,
  authorizeContributor,
};
