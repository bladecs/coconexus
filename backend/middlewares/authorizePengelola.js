'use strict';

const { forbidden } = require('../utils/httpErrors');

function authorizePengelola(...allowedJobs) {
  return (req, res, next) => {
    if (!req.user) {
      return next(forbidden('User belum terautentikasi.'));
    }

    if (req.user.role !== 'pengelola') {
      return next(forbidden('Akses khusus pengelola.'));
    }

    // Parameter allowedJobs dipertahankan untuk kompatibilitas route lama,
    // tetapi otorisasi pengelola kini sepenuhnya berbasis role.
    return next();
  };
}

module.exports = {
  authorizePengelola,
};
