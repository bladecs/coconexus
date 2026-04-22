'use strict';

const { forbidden } = require('../utils/httpErrors');

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

module.exports = {
  authorize,
};
