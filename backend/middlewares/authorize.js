'use strict';

const { forbidden } = require('../utils/httpErrors');
const { normalizeJobTitle } = require('../utils/validators');

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

    if (req.user.role === 'admin') {
      return next();
    }

    if (req.user.role !== 'pengelola') {
      return next(forbidden('Anda tidak memiliki akses ke resource ini.'));
    }

    const jobTitle = normalizeJobTitle(req.user.profile?.job_title);

    if (!jobTitle || !allowedJobs.includes(jobTitle)) {
      return next(forbidden('Jabatan Anda tidak memiliki akses ke resource ini.'));
    }

    return next();
  };
}

module.exports = {
  authorize,
  authorizeJobs,
};
