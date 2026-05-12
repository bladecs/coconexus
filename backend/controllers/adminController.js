'use strict';

const { Article, ArticleView, CategoryTag, Comment, User, AuditLog, UserProfile, sequelize } = require('../models');
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
      totalArticleViews,
      userCountByRole,
      userCountByMonthRaw,
      activeUserCountByMonthRaw,
      articleViewsByMonthRaw,
      readerActivityByArticle,
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
      ArticleView.count(),
      User.findAll({
        attributes: [
          'role',
          [sequelize.fn('COUNT', sequelize.col('id')), 'user_count'],
        ],
        group: ['role'],
        order: [['role', 'ASC']],
      }),
      sequelize.query(
        `
          SELECT DATE_FORMAT(created_at, '%Y-%m') AS month_key, COUNT(*) AS total_users
          FROM User
          WHERE deleted_at IS NULL
          GROUP BY DATE_FORMAT(created_at, '%Y-%m')
          ORDER BY month_key ASC
        `,
        { type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `
          SELECT
            DATE_FORMAT(created_at, '%Y-%m') AS month_key,
            COUNT(DISTINCT COALESCE(CAST(user_id AS CHAR), session_id, ip_hash)) AS active_users
          FROM ArticleView
          GROUP BY DATE_FORMAT(created_at, '%Y-%m')
          ORDER BY month_key ASC
        `,
        { type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `
          SELECT DATE_FORMAT(created_at, '%Y-%m') AS month_key, COUNT(*) AS total_views
          FROM ArticleView
          GROUP BY DATE_FORMAT(created_at, '%Y-%m')
          ORDER BY month_key ASC
        `,
        { type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `
          SELECT
            Article.id AS article_id,
            Article.title AS article_title,
            COUNT(ArticleView.id) AS interaction_count,
            COUNT(DISTINCT COALESCE(CAST(ArticleView.user_id AS CHAR), ArticleView.session_id, ArticleView.ip_hash)) AS active_readers
          FROM Article
          LEFT JOIN ArticleView ON ArticleView.article_id = Article.id
          WHERE Article.status = 'published'
          GROUP BY Article.id, Article.title
          ORDER BY interaction_count DESC, Article.updated_at DESC
          LIMIT 8
        `,
        { type: QueryTypes.SELECT }
      ),
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
    const userMonthKeys = userCountByMonthRaw.map((item) => item.month_key);
    const userMonthLabels = buildMonthLabels(userMonthKeys);
    const activeUserMonthKeys = activeUserCountByMonthRaw.map((item) => item.month_key);
    const activeUserMonthLabels = buildMonthLabels(activeUserMonthKeys);
    const articleViewMonthKeys = articleViewsByMonthRaw.map((item) => item.month_key);
    const articleViewMonthLabels = buildMonthLabels(articleViewMonthKeys);

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
          article_views: totalArticleViews,
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
          users_by_role: {
            labels: userCountByRole.map((item) => item.role),
            datasets: [
              {
                label: 'Jumlah User',
                data: userCountByRole.map((item) => Number(item.get('user_count') || 0)),
              },
            ],
            items: userCountByRole.map((item) => ({
              role: item.role,
              user_count: Number(item.get('user_count') || 0),
            })),
          },
          users_by_month: {
            labels: userMonthLabels,
            datasets: [
              {
                label: 'User Baru',
                data: userCountByMonthRaw.map((item) => Number(item.total_users || 0)),
              },
            ],
            items: userCountByMonthRaw.map((item, index) => ({
              month_key: item.month_key,
              month_label: userMonthLabels[index],
              user_count: Number(item.total_users || 0),
            })),
          },
          active_users_by_month: {
            labels: activeUserMonthLabels,
            datasets: [
              {
                label: 'User Aktif',
                data: activeUserCountByMonthRaw.map((item) => Number(item.active_users || 0)),
              },
            ],
            items: activeUserCountByMonthRaw.map((item, index) => ({
              month_key: item.month_key,
              month_label: activeUserMonthLabels[index],
              active_users: Number(item.active_users || 0),
            })),
          },
          article_views_by_month: {
            labels: articleViewMonthLabels,
            datasets: [
              {
                label: 'Total Dibaca',
                data: articleViewsByMonthRaw.map((item) => Number(item.total_views || 0)),
              },
            ],
            items: articleViewsByMonthRaw.map((item, index) => ({
              month_key: item.month_key,
              month_label: articleViewMonthLabels[index],
              view_count: Number(item.total_views || 0),
            })),
          },
          reader_activity_by_article: {
            labels: readerActivityByArticle.map((item) => item.article_title),
            datasets: [
              {
                label: 'Interaksi Baca',
                data: readerActivityByArticle.map((item) => Number(item.interaction_count || 0)),
              },
            ],
            items: readerActivityByArticle.map((item) => ({
              article_id: item.article_id,
              article_title: item.article_title,
              interaction_count: Number(item.interaction_count || 0),
              active_readers: Number(item.active_readers || 0),
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
