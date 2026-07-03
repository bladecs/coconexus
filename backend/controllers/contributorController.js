'use strict';

const { Op } = require('sequelize');
const { User, UserProfile, sequelize } = require('../models');
const { badRequest, notFound, conflict } = require('../utils/httpErrors');
const { sanitizeUser } = require('../utils/serializers');
const { isNonEmptyString } = require('../utils/validators');

async function applyContributor(req, res, next) {
  try {
    const note = typeof req.body.note === 'string' ? req.body.note.trim() : '';

    if (!isNonEmptyString(note)) {
      throw badRequest('Cantumkan alasan atau latar belakang keahlian Anda.');
    }

    const profile = await UserProfile.findOne({ where: { user_id: req.user.id } });

    if (!profile) {
      throw notFound('Profil user tidak ditemukan.');
    }

    if (profile.contributor_status === 'approved') {
      throw conflict('Akun Anda sudah terdaftar sebagai kontributor terverifikasi.');
    }

    if (profile.contributor_status === 'pending') {
      throw conflict('Permohonan Anda sedang dalam proses peninjauan.');
    }

    profile.contributor_status = 'pending';
    profile.contributor_note = note;
    profile.contributor_reviewed_by = null;
    profile.contributor_reviewed_at = null;
    await profile.save();

    const user = await User.findByPk(req.user.id, {
      include: [{ model: UserProfile, as: 'profile' }],
    });

    return res.status(200).json({
      success: true,
      message: 'Permohonan kontributor berhasil dikirim.',
      data: { user: sanitizeUser(user) },
    });
  } catch (error) {
    return next(error);
  }
}

async function cancelContributorRequest(req, res, next) {
  try {
    const profile = await UserProfile.findOne({ where: { user_id: req.user.id } });

    if (!profile) {
      throw notFound('Profil user tidak ditemukan.');
    }

    if (profile.contributor_status !== 'pending') {
      throw badRequest('Tidak ada permohonan yang sedang menunggu untuk dibatalkan.');
    }

    profile.contributor_status = 'none';
    profile.contributor_note = null;
    await profile.save();

    return res.status(200).json({
      success: true,
      message: 'Permohonan kontributor berhasil dibatalkan.',
    });
  } catch (error) {
    return next(error);
  }
}

async function listContributorRequests(req, res, next) {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : 'pending';
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 50);
    const offset = (page - 1) * limit;

    const validStatuses = ['none', 'pending', 'approved', 'rejected', 'all'];
    const statusFilter =
      status !== 'all' && validStatuses.includes(status) ? { contributor_status: status } : {};

    const { rows: profiles, count } = await UserProfile.findAndCountAll({
      where: {
        ...statusFilter,
        ...(status === 'all' ? { contributor_status: { [Op.ne]: 'none' } } : {}),
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'role', 'created_at'],
        },
      ],
      order: [['contributor_reviewed_at', 'ASC'], ['user_id', 'ASC']],
      limit,
      offset,
    });

    const requests = profiles.map((p) => ({
      user_id: p.user_id,
      email: p.user?.email,
      full_name: p.full_name,
      job_title: p.job_title,
      department: p.department,
      contributor_status: p.contributor_status,
      contributor_note: p.contributor_note,
      contributor_reviewed_by: p.contributor_reviewed_by,
      contributor_reviewed_at: p.contributor_reviewed_at,
      user_created_at: p.user?.created_at,
    }));

    return res.status(200).json({
      success: true,
      message: 'Daftar permohonan kontributor berhasil diambil.',
      data: {
        requests,
        meta: {
          page,
          limit,
          total_items: count,
          total_pages: Math.ceil(count / limit),
          status,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function reviewContributorRequest(req, res, next) {
  const transaction = await sequelize.transaction();
  try {
    const targetUserId = Number(req.params.userId);

    if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
      throw badRequest('Parameter userId tidak valid.');
    }

    const action = typeof req.body.action === 'string' ? req.body.action.trim() : '';
    const reviewNote =
      typeof req.body.note === 'string' ? req.body.note.trim() : null;

    if (!['approve', 'reject'].includes(action)) {
      throw badRequest('Action harus berupa "approve" atau "reject".');
    }

    const profile = await UserProfile.findOne({
      where: { user_id: targetUserId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!profile) {
      throw notFound('Profil user tidak ditemukan.');
    }

    if (profile.contributor_status !== 'pending') {
      throw conflict('Permohonan ini sudah diproses atau belum diajukan.');
    }

    profile.contributor_status = action === 'approve' ? 'approved' : 'rejected';
    if (reviewNote) {
      profile.contributor_note = reviewNote;
    }
    profile.contributor_reviewed_by = req.user.id;
    profile.contributor_reviewed_at = new Date();
    await profile.save({ transaction });

    await transaction.commit();

    const user = await User.findByPk(targetUserId, {
      include: [{ model: UserProfile, as: 'profile' }],
    });

    return res.status(200).json({
      success: true,
      message:
        action === 'approve'
          ? 'Permohonan kontributor berhasil disetujui.'
          : 'Permohonan kontributor ditolak.',
      data: { user: sanitizeUser(user) },
    });
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
}

module.exports = {
  applyContributor,
  cancelContributorRequest,
  listContributorRequests,
  reviewContributorRequest,
};
