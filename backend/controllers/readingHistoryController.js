'use strict';

const { ReadingHistory, Article, ArticleDetail, ArticleMedia, Category, Tag, User, UserProfile } = require('../models');
const { badRequest } = require('../utils/httpErrors');
const { sanitizeArticle } = require('../utils/serializers');

async function recordRead(req, res, next) {
  try {
    const articleId = Number(req.params.articleId);
    if (!Number.isInteger(articleId) || articleId <= 0) throw badRequest('Parameter article id tidak valid.');

    const article = await Article.findOne({ where: { id: articleId, status: 'published' }, attributes: ['id'] });
    if (!article) return res.status(200).json({ success: true, data: { recorded: false } });

    const now = new Date();
    const [record, created] = await ReadingHistory.findOrCreate({
      where: { user_id: req.user.id, article_id: articleId },
      defaults: { user_id: req.user.id, article_id: articleId, read_at: now },
    });
    if (!created) {
      record.read_at = now;
      await record.save();
    }

    return res.status(200).json({ success: true, data: { recorded: true, article_id: articleId } });
  } catch (err) {
    return next(err);
  }
}

async function listHistory(req, res, next) {
  try {
    const page  = Math.max(Number(req.query.page  || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 12), 1), 50);
    const offset = (page - 1) * limit;

    const count = await ReadingHistory.count({ where: { user_id: req.user.id } });

    const rows = await ReadingHistory.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: Article,
          as: 'article',
          where: { status: 'published' },
          required: true,
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['id', 'email', 'role'],
              include: [{ model: UserProfile, as: 'profile', attributes: ['user_id', 'full_name', 'avatar_url'] }],
            },
            { model: Category, as: 'category', attributes: ['id', 'name'] },
            { model: Tag, as: 'tags', through: { attributes: [] }, attributes: ['id', 'name'] },
            { model: ArticleDetail, as: 'detail', attributes: ['difficulty_level', 'meta_description'] },
            { model: ArticleMedia, as: 'media', attributes: ['id', 'file_path', 'media_type'] },
          ],
        },
      ],
      order: [['read_at', 'DESC']],
      limit,
      offset,
    });

    return res.status(200).json({
      success: true,
      data: {
        history: rows.map((r) => ({
          id: r.id,
          read_at: r.read_at,
          article: sanitizeArticle(r.article, { includeComments: false }),
        })),
        meta: { page, limit, total_items: count, total_pages: Math.ceil(count / limit) },
      },
    });
  } catch (err) {
    return next(err);
  }
}

async function getReadIds(req, res, next) {
  try {
    const rows = await ReadingHistory.findAll({
      where: { user_id: req.user.id },
      attributes: ['article_id'],
    });
    return res.status(200).json({
      success: true,
      data: { article_ids: rows.map((r) => r.article_id) },
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { recordRead, listHistory, getReadIds };
