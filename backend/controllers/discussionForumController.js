'use strict';

const { Op } = require('sequelize');
const {
  Article,
  Comment,
  DiscussionForum,
  DiscussionForumSourceComment,
  User,
  UserProfile,
  sequelize,
} = require('../models');
const { badRequest, notFound, forbidden } = require('../utils/httpErrors');
const { isNonEmptyString } = require('../utils/validators');
const { writeAuditLog } = require('../utils/auditLogger');
const { buildCommentTree, sanitizeComment } = require('../utils/serializers');

function normalizeCommentIdList(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(
    value
      .map((item) => Number(item))
      .filter((item) => Number.isInteger(item) && item > 0)
  )];
}

function serializeForum(forum) {
  return {
    id: forum.id,
    article_id: forum.article_id,
    title: forum.title,
    summary: forum.summary,
    status: forum.status,
    created_by_id: forum.created_by_id,
    validated_by_id: forum.validated_by_id,
    validated_at: forum.validated_at,
    notes: forum.notes,
    created_at: forum.created_at,
    updated_at: forum.updated_at,
    article: forum.article
      ? {
          id: forum.article.id,
          title: forum.article.title,
          status: forum.article.status,
        }
      : null,
    creator: forum.creator
      ? {
          id: forum.creator.id,
          email: forum.creator.email,
          role: forum.creator.role,
          profile: forum.creator.profile
            ? {
                user_id: forum.creator.profile.user_id,
                full_name: forum.creator.profile.full_name,
                job_title: forum.creator.profile.job_title,
              }
            : null,
        }
      : null,
    validator: forum.validator
      ? {
          id: forum.validator.id,
          email: forum.validator.email,
          role: forum.validator.role,
          profile: forum.validator.profile
            ? {
                user_id: forum.validator.profile.user_id,
                full_name: forum.validator.profile.full_name,
                job_title: forum.validator.profile.job_title,
              }
            : null,
        }
      : null,
    source_comments: Array.isArray(forum.sourceLinks)
      ? forum.sourceLinks.map((link) => ({
          id: link.id,
          comment_id: link.comment_id,
          note: link.note,
          comment: link.comment
            ? {
                id: link.comment.id,
                body: link.comment.body,
                status: link.comment.status,
                user_id: link.comment.user_id,
                article_id: link.comment.article_id,
                created_at: link.comment.created_at,
              }
            : null,
        }))
      : [],
  };
}

async function createDiscussionForumDraft(req, res, next) {
  const transaction = await sequelize.transaction();

  try {
    const articleId = Number(req.body.article_id);
    const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
    const summary = typeof req.body.summary === 'string' ? req.body.summary.trim() : null;
    const notes = typeof req.body.notes === 'string' ? req.body.notes.trim() : null;
    const commentIds = normalizeCommentIdList(req.body.comment_ids);

    if (!Number.isInteger(articleId) || articleId <= 0) {
      throw badRequest('article_id tidak valid.');
    }

    if (!isNonEmptyString(title)) {
      throw badRequest('title forum wajib diisi.');
    }

    // comment_ids bersifat opsional — Fasilitator Diskusi dapat membuat topik forum baru
    // dari nol (tanpa mengurasi komentar yang sudah ada), atau tetap mengaitkannya ke
    // komentar-komentar tertentu bila diisi.
    const article = await Article.findByPk(articleId, { transaction });
    if (!article) {
      throw notFound('Artikel tidak ditemukan.');
    }

    let comments = [];
    if (commentIds.length > 0) {
      comments = await Comment.findAll({
        where: {
          id: commentIds,
          article_id: articleId,
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'role'],
            include: [
              {
                model: UserProfile,
                as: 'profile',
                attributes: ['user_id', 'full_name', 'job_title'],
              },
            ],
          },
        ],
        transaction,
      });

      if (comments.length !== commentIds.length) {
        throw badRequest('Sebagian komentar tidak ditemukan pada artikel yang sama.');
      }

      const invalidComment = comments.find((comment) => comment.status === 'rejected');
      if (invalidComment) {
        throw forbidden('Komentar yang ditolak tidak dapat dijadikan sumber forum.');
      }
    }

    const forum = await DiscussionForum.create(
      {
        article_id: articleId,
        title,
        summary,
        status: 'draft',
        created_by_id: req.user.id,
        validated_by_id: null,
        validated_at: null,
        notes,
      },
      { transaction }
    );

    await DiscussionForumSourceComment.bulkCreate(
      comments.map((comment) => ({
        discussion_forum_id: forum.id,
        comment_id: comment.id,
        note: null,
      })),
      { transaction }
    );

    const createdForum = await DiscussionForum.findByPk(forum.id, {
      include: [
        {
          model: Article,
          as: 'article',
          attributes: ['id', 'title', 'status'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'email', 'role'],
          include: [
            {
              model: UserProfile,
              as: 'profile',
              attributes: ['user_id', 'full_name', 'job_title'],
            },
          ],
        },
        {
          model: User,
          as: 'validator',
          attributes: ['id', 'email', 'role'],
        },
        {
          model: DiscussionForumSourceComment,
          as: 'sourceLinks',
          include: [
            {
              model: Comment,
              as: 'comment',
              attributes: ['id', 'body', 'status', 'user_id', 'article_id', 'created_at'],
            },
          ],
        },
      ],
      transaction,
    });

    await transaction.commit();

    await writeAuditLog({
      actorId: req.user.id,
      action: 'moderator.forum.create_forum_draft',
      entityType: 'discussion_forum',
      entityId: forum.id,
      metadata: {
        article_id: articleId,
        comment_ids: commentIds,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Draft forum diskusi berhasil dibuat.',
      data: {
        forum: serializeForum(createdForum),
      },
    });
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
}

async function validateDiscussionForum(req, res, next) {
  const transaction = await sequelize.transaction();

  try {
    const forumId = Number(req.params.id);
    const title = typeof req.body.title === 'string' ? req.body.title.trim() : undefined;
    const summary = req.body.summary === undefined ? undefined : (typeof req.body.summary === 'string' ? req.body.summary.trim() : '');
    const notes = req.body.notes === undefined ? undefined : (typeof req.body.notes === 'string' ? req.body.notes.trim() : '');

    if (!Number.isInteger(forumId) || forumId <= 0) {
      throw badRequest('Parameter forum id tidak valid.');
    }

    const forum = await DiscussionForum.findByPk(forumId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!forum) {
      throw notFound('Forum diskusi tidak ditemukan.');
    }

    if (forum.status !== 'draft') {
      throw badRequest('Hanya draft forum yang dapat divalidasi.');
    }

    if (title !== undefined) {
      if (!isNonEmptyString(title)) {
        throw badRequest('title forum tidak boleh kosong.');
      }
      forum.title = title;
    }

    if (summary !== undefined) {
      forum.summary = summary || null;
    }

    if (notes !== undefined) {
      forum.notes = notes || null;
    }

    forum.status = 'validated';
    forum.validated_by_id = req.user.id;
    forum.validated_at = new Date();
    await forum.save({ transaction });

    const validatedForum = await DiscussionForum.findByPk(forum.id, {
      include: [
        {
          model: Article,
          as: 'article',
          attributes: ['id', 'title', 'status'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'email', 'role'],
          include: [
            {
              model: UserProfile,
              as: 'profile',
              attributes: ['user_id', 'full_name', 'job_title'],
            },
          ],
        },
        {
          model: User,
          as: 'validator',
          attributes: ['id', 'email', 'role'],
          include: [
            {
              model: UserProfile,
              as: 'profile',
              attributes: ['user_id', 'full_name', 'job_title'],
            },
          ],
        },
        {
          model: DiscussionForumSourceComment,
          as: 'sourceLinks',
          include: [
            {
              model: Comment,
              as: 'comment',
              attributes: ['id', 'body', 'status', 'user_id', 'article_id', 'created_at'],
            },
          ],
        },
      ],
      transaction,
    });

    await transaction.commit();

    await writeAuditLog({
      actorId: req.user.id,
      action: 'moderator.forum.validate_forum',
      entityType: 'discussion_forum',
      entityId: forum.id,
      metadata: {
        status: forum.status,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Forum diskusi berhasil divalidasi.',
      data: {
        forum: serializeForum(validatedForum),
      },
    });
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
}

async function activateDiscussionForum(req, res, next) {
  const transaction = await sequelize.transaction();

  try {
    const forumId = Number(req.params.id);

    if (!Number.isInteger(forumId) || forumId <= 0) {
      throw badRequest('Parameter forum id tidak valid.');
    }

    const forum = await DiscussionForum.findByPk(forumId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!forum) {
      throw notFound('Forum diskusi tidak ditemukan.');
    }

    if (forum.status !== 'validated') {
      throw badRequest('Hanya forum yang sudah divalidasi yang dapat diaktifkan.');
    }

    await DiscussionForum.update(
      { status: 'closed' },
      {
        where: {
          article_id: forum.article_id,
          status: 'active',
          id: {
            [Op.ne]: forum.id,
          },
        },
        transaction,
      }
    );

    forum.status = 'active';
    await forum.save({ transaction });

    const activeForum = await DiscussionForum.findByPk(forum.id, {
      include: [
        {
          model: Article,
          as: 'article',
          attributes: ['id', 'title', 'status'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'email', 'role'],
        },
        {
          model: User,
          as: 'validator',
          attributes: ['id', 'email', 'role'],
        },
        {
          model: DiscussionForumSourceComment,
          as: 'sourceLinks',
          include: [
            {
              model: Comment,
              as: 'comment',
              attributes: ['id', 'body', 'status', 'user_id', 'article_id', 'created_at'],
            },
          ],
        },
      ],
      transaction,
    });

    await transaction.commit();

    await writeAuditLog({
      actorId: req.user.id,
      action: 'moderator.forum.activate_forum',
      entityType: 'discussion_forum',
      entityId: forum.id,
      metadata: {
        status: forum.status,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Forum diskusi berhasil diaktifkan.',
      data: {
        forum: serializeForum(activeForum),
      },
    });
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
}

async function listDiscussionForums(req, res, next) {
  try {
    const articleId = req.query.article_id === undefined ? null : Number(req.query.article_id);
    const status = typeof req.query.status === 'string' ? req.query.status.trim().toLowerCase() : '';

    const where = {};

    if (Number.isInteger(articleId) && articleId > 0) {
      where.article_id = articleId;
    }

    if (status && ['draft', 'validated', 'active', 'closed'].includes(status)) {
      where.status = status;
    }

    const forums = await DiscussionForum.findAll({
      where,
      include: [
        {
          model: Article,
          as: 'article',
          attributes: ['id', 'title', 'status'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'email', 'role'],
        },
        {
          model: User,
          as: 'validator',
          attributes: ['id', 'email', 'role'],
        },
        {
          model: DiscussionForumSourceComment,
          as: 'sourceLinks',
        },
      ],
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      message: 'Daftar forum diskusi berhasil diambil.',
      data: {
        forums: forums.map(serializeForum),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getActiveDiscussionForumByArticle(req, res, next) {
  try {
    const articleId = Number(req.params.articleId);

    if (!Number.isInteger(articleId) || articleId <= 0) {
      throw badRequest('Parameter article id tidak valid.');
    }

    const forum = await DiscussionForum.findOne({
      where: {
        article_id: articleId,
        status: 'active',
      },
      include: [
        {
          model: Article,
          as: 'article',
          attributes: ['id', 'title', 'status'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'email', 'role'],
          include: [
            {
              model: UserProfile,
              as: 'profile',
              attributes: ['user_id', 'full_name', 'job_title'],
            },
          ],
        },
        {
          model: User,
          as: 'validator',
          attributes: ['id', 'email', 'role'],
          include: [
            {
              model: UserProfile,
              as: 'profile',
              attributes: ['user_id', 'full_name', 'job_title'],
            },
          ],
        },
        {
          model: DiscussionForumSourceComment,
          as: 'sourceLinks',
          include: [
            {
              model: Comment,
              as: 'comment',
              attributes: ['id', 'body', 'status', 'user_id', 'article_id', 'created_at'],
            },
          ],
        },
      ],
    });

    if (!forum) {
      throw notFound('Forum diskusi aktif belum tersedia untuk artikel ini.');
    }

    const commentsCount = await Comment.count({
      where: {
        discussion_forum_id: forum.id,
        status: 'approved',
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Forum diskusi aktif berhasil diambil.',
      data: {
        forum: {
          ...serializeForum(forum),
          comments_count: commentsCount,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function listForumComments(req, res, next) {
  try {
    const forumId = Number(req.params.forumId);

    if (!Number.isInteger(forumId) || forumId <= 0) {
      throw badRequest('Parameter forum id tidak valid.');
    }

    const forum = await DiscussionForum.findOne({
      where: {
        id: forumId,
        status: 'active',
      },
    });

    if (!forum) {
      throw notFound('Forum diskusi aktif tidak ditemukan.');
    }

    const comments = await Comment.findAll({
      where: {
        discussion_forum_id: forumId,
        status: 'approved',
      },
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
      order: [['created_at', 'ASC']],
    });

    return res.status(200).json({
      success: true,
      message: 'Daftar komentar forum berhasil diambil.',
      data: {
        comments: buildCommentTree(comments),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function createForumComment(req, res, next) {
  try {
    const forumId = Number(req.params.forumId);
    const body = typeof req.body.body === 'string' ? req.body.body.trim() : '';
    const parentId = req.body.parent_id === undefined || req.body.parent_id === null
      ? null
      : Number(req.body.parent_id);

    if (!Number.isInteger(forumId) || forumId <= 0) {
      throw badRequest('Parameter forum id tidak valid.');
    }

    if (!isNonEmptyString(body)) {
      throw badRequest('body komentar wajib diisi.');
    }

    const forum = await DiscussionForum.findOne({
      where: {
        id: forumId,
        status: 'active',
      },
    });

    if (!forum) {
      throw notFound('Forum diskusi aktif tidak ditemukan.');
    }

    if (parentId !== null) {
      if (!Number.isInteger(parentId) || parentId <= 0) {
        throw badRequest('parent_id tidak valid.');
      }

      const parentComment = await Comment.findByPk(parentId);

      if (!parentComment || parentComment.discussion_forum_id !== forumId) {
        throw badRequest('Komentar induk tidak ditemukan pada forum yang sama.');
      }
    }

    const comment = await Comment.create({
      body,
      status: 'approved',
      user_id: req.user.id,
      article_id: forum.article_id,
      discussion_forum_id: forumId,
      parent_id: parentId,
      attachment_name: req.file ? req.file.originalname : null,
      attachment_path: req.file ? `/uploads/comment-attachments/${req.file.filename}` : null,
      attachment_mime_type: req.file ? req.file.mimetype : null,
      attachment_size: req.file ? req.file.size : null,
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
        ? 'Balasan forum berhasil ditambahkan.'
        : 'Komentar forum berhasil ditambahkan.',
      data: {
        comment: sanitizeComment(createdComment),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function listPublicForums(req, res, next) {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 12), 1), 50);
    const offset = (page - 1) * limit;

    const where = { status: 'active' };

    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { summary: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await DiscussionForum.findAndCountAll({
      where,
      include: [
        {
          model: Article,
          as: 'article',
          attributes: ['id', 'title', 'article_type'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'email'],
          include: [
            {
              model: UserProfile,
              as: 'profile',
              attributes: ['full_name', 'job_title'],
            },
          ],
        },
      ],
      order: [['validated_at', 'DESC']],
      limit,
      offset,
    });

    const forumsWithCounts = await Promise.all(
      rows.map(async (forum) => {
        const commentsCount = await Comment.count({
          where: { discussion_forum_id: forum.id, status: 'approved' },
        });
        return {
          ...serializeForum(forum),
          comments_count: commentsCount,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        forums: forumsWithCounts,
        meta: {
          page,
          limit,
          total_items: count,
          total_pages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createDiscussionForumDraft,
  validateDiscussionForum,
  activateDiscussionForum,
  listDiscussionForums,
  listPublicForums,
  getActiveDiscussionForumByArticle,
  listForumComments,
  createForumComment,
};
