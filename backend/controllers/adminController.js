'use strict';

const { Article, CategoryTag, Comment, User, AuditLog, UserProfile, sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

function buildMonthLabels(monthKeys) {
  return monthKeys.map((monthKey) => {
    const [year, month] = monthKey.split('-').map(Number);
    return new Intl.DateTimeFormat('id-ID', {
      month: 'short',
      year: 'numeric',
    }).format(new Date(year, month - 1, 1));
  });
}

async function getDashboardStats(req, res, next) {
  try {
    const [
      totalUsers,
      totalArticles,
      totalPublishedArticles,
      totalDraftArticles,
      totalRevisionArticles,
      totalCategories,
      totalComments,
      recentActivities,
      articleCountByCategory,
      commentCountByMonthRaw,
    ] = await Promise.all([
      User.count(),
      Article.count(),
      Article.count({ where: { status: 'published' } }),
      Article.count({ where: { status: 'draft' } }),
      Article.count({ where: { status: 'revision' } }),
      CategoryTag.count(),
      Comment.count(),
      AuditLog.findAll({
        include: [
          {
            model: User,
            as: 'actor',
            attributes: ['id', 'email', 'role'],
            include: [
              {
                model: UserProfile,
                as: 'profile',
                attributes: ['user_id', 'full_name', 'avatar_url'],
              },
            ],
          },
        ],
        order: [['created_at', 'DESC']],
        limit: 8,
      }),
      CategoryTag.findAll({
        attributes: [
          'id',
          'name',
          [sequelize.fn('COUNT', sequelize.col('articles.id')), 'article_count'],
        ],
        include: [
          {
            model: Article,
            as: 'articles',
            attributes: [],
            required: false,
          },
        ],
        group: ['CategoryTag.id'],
        order: [[sequelize.literal('article_count'), 'DESC'], ['name', 'ASC']],
        subQuery: false,
      }),
      sequelize.query(
        `
          SELECT DATE_FORMAT(created_at, '%Y-%m') AS month_key, COUNT(*) AS total_comments
          FROM Comment
          GROUP BY DATE_FORMAT(created_at, '%Y-%m')
          ORDER BY month_key ASC
        `,
        { type: QueryTypes.SELECT }
      ),
    ]);

    const commentMonthKeys = commentCountByMonthRaw.map((item) => item.month_key);
    const commentMonthLabels = buildMonthLabels(commentMonthKeys);
    const commentMonthlyData = commentCountByMonthRaw.map((item) => Number(item.total_comments || 0));

    return res.status(200).json({
      success: true,
      message: 'Statistik dashboard berhasil diambil.',
      data: {
        totals: {
          users: totalUsers,
          articles: totalArticles,
          published_articles: totalPublishedArticles,
          draft_articles: totalDraftArticles,
          revision_articles: totalRevisionArticles,
          categories: totalCategories,
          comments: totalComments,
        },
        charts: {
          articles_by_category: {
            labels: articleCountByCategory.map((item) => item.name),
            datasets: [
              {
                label: 'Jumlah Artikel',
                data: articleCountByCategory.map((item) => Number(item.get('article_count') || 0)),
              },
            ],
            items: articleCountByCategory.map((item) => ({
              category_id: item.id,
              category_name: item.name,
              article_count: Number(item.get('article_count') || 0),
            })),
          },
          comments_by_month: {
            labels: commentMonthLabels,
            datasets: [
              {
                label: 'Jumlah Komentar',
                data: commentMonthlyData,
              },
            ],
            items: commentCountByMonthRaw.map((item, index) => ({
              month_key: item.month_key,
              month_label: commentMonthLabels[index],
              comment_count: commentMonthlyData[index],
            })),
          },
        },
        recent_activities: recentActivities.map((item) => ({
          id: item.id,
          action: item.action,
          entity_type: item.entity_type,
          entity_id: item.entity_id,
          metadata: item.metadata,
          created_at: item.created_at,
          actor: item.actor,
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getDashboardStats,
};
