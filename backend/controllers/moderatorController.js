'use strict';

const { MODERATOR_MODULES } = require('../utils/accessControl');

async function getModeratorOverview(req, res, next) {
  try {
    return res.status(200).json({
      success: true,
      message: 'Ringkasan moderator berhasil diambil.',
      data: {
        role: 'moderator',
        actor: {
          id: req.user.id,
          email: req.user.email,
          moderator_type: req.user.moderatorAssignment?.moderator_type || null,
        },
        modules: MODERATOR_MODULES,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getModeratorOverview,
};
