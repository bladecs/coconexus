'use strict';

const { PENGELOLA_MODULES } = require('../utils/accessControl');

async function getPengelolaOverview(req, res, next) {
  try {
    return res.status(200).json({
      success: true,
      message: 'Ringkasan akses pengelola berhasil diambil.',
      data: {
        role: 'pengelola',
        actor: {
          id: req.user.id,
          email: req.user.email,
          job_title: req.user.profile?.job_title || null,
          department: req.user.profile?.department || null,
          division: req.user.profile?.division || null,
        },
        modules: PENGELOLA_MODULES,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getPengelolaOverview,
};
