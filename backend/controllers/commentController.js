'use strict';

const { Op } = require('sequelize');
const { Article, Comment, User, UserProfile } = require('../models');
const { badRequest, notFound, forbidden } = require('../utils/httpErrors');
const {
  isNonEmptyString,
  isValidCommentStatus,
  normalizeCommentStatus,
  normalizeJobTitle,
} = require('../utils/validators');
const { buildCommentTree, sanitizeComment } = require('../utils/serializers');
const { writeAuditLog } = require('../utils/auditLogger');

async function listArticleComments(req, res, next) {
  try {
    const articleId = Number(req.params.articleId);

    if (!Number.isInteger(articleId) || articleId <= 0) {
      throw badRequest('Parameter article id tidak valid.');
    }

    const article = await Article.findOne({
      where: {
        id: articleId,
        status: 'published',
      },
    });

    if (!article) {
      throw notFound('Artikel published tidak ditemukan.');
    }

    const comments = await Comment.findAll({
      where: { article_id: articleId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'role'],
          include: [
            {
              model: UserProfile,
              as: 'profile',
              attributes: ['user_id', 'full_name', 'bio', 'avatar_url'],
            },
          ],
        },
      ],
      where: {
        status: 'approved',
      },
      order: [['created_at', 'ASC']],
    });

    return res.status(200).json({
      success: true,
      message: 'Daftar komentar berhasil diambil.',
      data: {
        comments: buildCommentTree(comments),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function createComment(req, res, next) {
  try {
    const articleId = Number(req.params.articleId);
    const body = typeof req.body.body === 'string' ? req.body.body.trim() : '';
    const parentId = req.body.parent_id === undefined || req.body.parent_id === null
      ? null
      : Number(req.body.parent_id);

    if (!Number.isInteger(articleId) || articleId <= 0) {
      throw badRequest('Parameter article id tidak valid.');
    }

    if (!isNonEmptyString(body)) {
      throw badRequest('body komentar wajib diisi.');
    }

    const article = await Article.findOne({
      where: {
        id: articleId,
        status: 'published',
      },
    });

    if (!article) {
      throw notFound('Komentar hanya dapat ditambahkan ke artikel published.');
    }

    if (parentId !== null) {
      if (!Number.isInteger(parentId) || parentId <= 0) {
        throw badRequest('parent_id tidak valid.');
      }

      const parentComment = await Comment.findByPk(parentId);

      if (!parentComment || parentComment.article_id !== articleId) {
        throw badRequest('Komentar induk tidak ditemukan pada artikel yang sama.');
      }
    }

    const comment = await Comment.create({
      body,
      status: 'pending',
      user_id: req.user.id,
      article_id: articleId,
      parent_id: parentId,
    });

    const createdComment = await Comment.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'role'],
          include: [
            {
              model: UserProfile,
              as: 'profile',
              attributes: ['user_id', 'full_name', 'bio', 'avatar_url'],
            },
          ],
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: parentId
        ? 'Balasan komentar berhasil ditambahkan dan menunggu moderasi.'
        : 'Komentar berhasil ditambahkan dan menunggu moderasi.',
      data: {
        comment: sanitizeComment(createdComment),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteComment(req, res, next) {
  try {
    const commentId = Number(req.params.id);

    if (!Number.isInteger(commentId) || commentId <= 0) {
      throw badRequest('Parameter comment id tidak valid.');
    }

    const comment = await Comment.findByPk(commentId);

    if (!comment) {
      throw notFound('Komentar tidak ditemukan.');
    }

    const isOwner = req.user.id === comment.user_id;
    const isAdmin = req.user.role === 'admin';
    const isCommentModerator =
      req.user.role === 'pengelola' && normalizeJobTitle(req.user.profile?.job_title) === 'Moderator Komentar';

    if (!isOwner && !isAdmin && !isCommentModerator) {
      throw forbidden('Anda tidak memiliki akses untuk menghapus komentar ini.');
    }

    await comment.destroy();

    if (isAdmin || isCommentModerator) {
      await writeAuditLog({
        actorId: req.user.id,
        action: isAdmin ? 'admin.delete_comment' : 'moderator.delete_comment',
        entityType: 'comment',
        entityId: commentId,
        metadata: {
          article_id: comment.article_id,
          owner_id: comment.user_id,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Komentar berhasil dihapus.',
    });
  } catch (error) {
    return next(error);
  }
}

async function listAdminComments(req, res, next) {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const articleId = Number(req.query.article_id || 0);
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 50);
    const offset = (page - 1) * limit;
    const authorArticlesOnly = req.query.author_articles_only === 'true' || req.query.author_articles_only === '1';
    const requestedStatus = normalizeCommentStatus(req.query.status);
    const jobTitle = normalizeJobTitle(req.user.profile?.job_title);
    const status =
      requestedStatus ||
      (req.user.role === 'pengelola' && jobTitle === 'Moderator Komentar' ? 'pending' : '');
    const where = {};

    if (search) {
      where[Op.or] = [
        {
          body: {
            [Op.like]: `%${search}%`,
          },
        },
        {
          '$article.title$': {
            [Op.like]: `%${search}%`,
          },
        },
        {
          '$user.email$': {
            [Op.like]: `%${search}%`,
          },
        },
        {
          '$user.profile.full_name$': {
            [Op.like]: `%${search}%`,
          },
        },
      ];
    }

    if (articleId > 0) {
      where.article_id = articleId;
    }

    if (status) {
      if (status !== 'all' && !isValidCommentStatus(status)) {
        throw badRequest('Status komentar tidak valid.');
      }

      if (status !== 'all') {
        where.status = status;
      }
    }

    // Build include with optional filtering for author's articles only
    const includes = [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'role'],
        include: [
          {
            model: UserProfile,
            as: 'profile',
            attributes: ['user_id', 'full_name', 'avatar_url'],
          },
        ],
      },
      {
        model: Article,
        as: 'article',
        attributes: ['id', 'title', 'status', 'author_id'],
        ...(authorArticlesOnly && {
          where: { author_id: req.user.id },
        }),
      },
    ];

    const { rows, count } = await Comment.findAndCountAll({
      where,
      include: includes,
      order: [['created_at', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    return res.status(200).json({
      success: true,
      message: 'Daftar komentar admin berhasil diambil.',
      data: {
        comments: rows.map((comment) => ({
          id: comment.id,
          content: comment.body,
          status: comment.status,
          user_id: comment.user_id,
          article_id: comment.article_id,
          parent_id: comment.parent_id,
          created_at: comment.created_at,
          article: comment.article,
          user: comment.user,
        })),
        meta: {
          page,
          limit,
          total_items: count,
          total_pages: Math.ceil(count / limit),
          search,
          article_id: articleId || null,
          status: status || 'all',
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function updateCommentStatus(req, res, next) {
  try {
    const commentId = Number(req.params.id);
    const status = normalizeCommentStatus(req.body.status);

    if (!Number.isInteger(commentId) || commentId <= 0) {
      throw badRequest('Parameter comment id tidak valid.');
    }

    if (!['approved', 'rejected'].includes(status)) {
      throw badRequest('Status komentar hanya boleh approved atau rejected.');
    }

    const comment = await Comment.findByPk(commentId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'role'],
          include: [
            {
              model: UserProfile,
              as: 'profile',
              attributes: ['user_id', 'full_name', 'avatar_url', 'job_title', 'department', 'division'],
            },
          ],
        },
        {
          model: Article,
          as: 'article',
          attributes: ['id', 'title', 'status', 'author_id'],
        },
      ],
    });

    if (!comment) {
      throw notFound('Komentar tidak ditemukan.');
    }

    comment.status = status;
    await comment.save();

    await writeAuditLog({
      actorId: req.user.id,
      action: `moderator.${status}_comment`,
      entityType: 'comment',
      entityId: comment.id,
      metadata: {
        article_id: comment.article_id,
        owner_id: comment.user_id,
        status,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        status === 'approved'
          ? 'Komentar berhasil disetujui.'
          : 'Komentar berhasil ditolak.',
      data: {
        comment: {
          id: comment.id,
          content: comment.body,
          status: comment.status,
          user_id: comment.user_id,
          article_id: comment.article_id,
          parent_id: comment.parent_id,
          created_at: comment.created_at,
          updated_at: comment.updated_at,
          article: comment.article,
          user: comment.user,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listArticleComments,
  createComment,
  deleteComment,
  listAdminComments,
  updateCommentStatus,
};
