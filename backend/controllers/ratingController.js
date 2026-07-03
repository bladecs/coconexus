'use strict';

const { ArticleRating, Article, sequelize } = require('../models');
const { fn, col } = require('sequelize');
const { badRequest, notFound } = require('../utils/httpErrors');

async function rateArticle(req, res, next) {
  try {
    const articleId = Number(req.params.id);
    const rating = Number(req.body.rating);

    if (!Number.isInteger(articleId) || articleId <= 0) {
      throw badRequest('Parameter article id tidak valid.');
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw badRequest('Rating harus berupa angka 1 sampai 5.');
    }

    const article = await Article.findOne({ where: { id: articleId, status: 'published' } });
    if (!article) throw notFound('Artikel tidak ditemukan.');

    const [existing, created] = await ArticleRating.findOrCreate({
      where: { article_id: articleId, user_id: req.user.id },
      defaults: { article_id: articleId, user_id: req.user.id, rating },
    });

    if (!created && existing.rating !== rating) {
      existing.rating = rating;
      await existing.save();
    }

    const stats = await ArticleRating.findOne({
      where: { article_id: articleId },
      attributes: [
        [fn('AVG', col('rating')), 'average'],
        [fn('COUNT', col('id')), 'count'],
      ],
      raw: true,
    });

    return res.status(200).json({
      success: true,
      message: 'Rating berhasil disimpan.',
      data: {
        user_rating: rating,
        average: stats.average ? parseFloat(Number(stats.average).toFixed(1)) : 0,
        count: Number(stats.count) || 0,
      },
    });
  } catch (err) {
    return next(err);
  }
}

async function getArticleRating(req, res, next) {
  try {
    const articleId = Number(req.params.id);

    if (!Number.isInteger(articleId) || articleId <= 0) {
      throw badRequest('Parameter article id tidak valid.');
    }

    const stats = await ArticleRating.findOne({
      where: { article_id: articleId },
      attributes: [
        [fn('AVG', col('rating')), 'average'],
        [fn('COUNT', col('id')), 'count'],
      ],
      raw: true,
    });

    let userRating = null;
    if (req.user) {
      const existing = await ArticleRating.findOne({
        where: { article_id: articleId, user_id: req.user.id },
        attributes: ['rating'],
      });
      userRating = existing?.rating ?? null;
    }

    return res.status(200).json({
      success: true,
      message: 'Rating artikel berhasil diambil.',
      data: {
        average: stats.average ? parseFloat(Number(stats.average).toFixed(1)) : 0,
        count: Number(stats.count) || 0,
        user_rating: userRating,
      },
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { rateArticle, getArticleRating };
