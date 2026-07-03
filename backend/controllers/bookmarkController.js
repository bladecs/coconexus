'use strict';

const { Bookmark, Article, ArticleDetail, ArticleMedia, Category, Tag, User, UserProfile } = require('../models');
const { badRequest, notFound } = require('../utils/httpErrors');
const { sanitizeArticle } = require('../utils/serializers');

async function toggleBookmark(req, res, next) {
  try {
    const articleId = Number(req.params.articleId);

    if (!Number.isInteger(articleId) || articleId <= 0) {
      throw badRequest('Parameter article id tidak valid.');
    }

    const article = await Article.findOne({ where: { id: articleId, status: 'published' } });
    if (!article) throw notFound('Artikel tidak ditemukan.');

    const existing = await Bookmark.findOne({
      where: { user_id: req.user.id, article_id: articleId },
    });

    if (existing) {
      await existing.destroy();
      return res.status(200).json({
        success: true,
        message: 'Bookmark dihapus.',
        data: { bookmarked: false, article_id: articleId },
      });
    }

    await Bookmark.create({ user_id: req.user.id, article_id: articleId });
    return res.status(201).json({
      success: true,
      message: 'Artikel berhasil disimpan ke bookmark.',
      data: { bookmarked: true, article_id: articleId },
    });
  } catch (err) {
    return next(err);
  }
}

async function checkBookmark(req, res, next) {
  try {
    const articleId = Number(req.params.articleId);

    if (!Number.isInteger(articleId) || articleId <= 0) {
      throw badRequest('Parameter article id tidak valid.');
    }

    const existing = await Bookmark.findOne({
      where: { user_id: req.user.id, article_id: articleId },
    });

    return res.status(200).json({
      success: true,
      data: { bookmarked: !!existing, article_id: articleId },
    });
  } catch (err) {
    return next(err);
  }
}

async function listBookmarks(req, res, next) {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 50);
    const offset = (page - 1) * limit;

    const count = await Bookmark.count({ where: { user_id: req.user.id } });

    const bookmarks = await Bookmark.findAll({
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
            { model: Category, as: 'category' },
            { model: Tag, as: 'tags', through: { attributes: [] }, attributes: ['id', 'name'] },
            { model: ArticleDetail, as: 'detail', attributes: ['difficulty_level', 'meta_description'] },
            { model: ArticleMedia, as: 'media' },
          ],
        },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return res.status(200).json({
      success: true,
      message: 'Daftar bookmark berhasil diambil.',
      data: {
        bookmarks: bookmarks.map((b) => ({
          id: b.id,
          created_at: b.created_at,
          article: sanitizeArticle(b.article, { includeComments: false }),
        })),
        meta: {
          page,
          limit,
          total_items: count,
          total_pages: Math.ceil(count / limit),
        },
      },
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { toggleBookmark, checkBookmark, listBookmarks };
