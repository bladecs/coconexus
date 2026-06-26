'use strict';

module.exports = (sequelize, DataTypes) => {
  const Article = sequelize.define(
    'Article',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      author_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      parent_article_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      article_type: {
        type: DataTypes.ENUM('main', 'detail', 'prosedur', 'panduan', 'referensi', 'studi_kasus', 'troubleshooting'),
        allowNull: false,
        defaultValue: 'main',
      },
      wawasan_article_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      version: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 1,
      },
      status: {
        type: DataTypes.ENUM('draft', 'revision', 'published'),
        allowNull: false,
        defaultValue: 'draft',
      },
    },
    {
      tableName: 'Article',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  Article.associate = (models) => {
    Article.belongsTo(models.User, {
      foreignKey: 'author_id',
      as: 'author',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    // Relasi kategori - satu artikel hanya bisa punya satu kategori
    Article.belongsTo(models.Category, {
      foreignKey: 'category_id',
      as: 'category',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    // Relasi tag - banyak artikel bisa punya banyak tag (many-to-many)
    Article.belongsToMany(models.Tag, {
      through: 'ArticleTag',
      foreignKey: 'article_id',
      otherKey: 'tag_id',
      as: 'tags',
    });



    Article.belongsTo(models.Article, {
      foreignKey: 'parent_article_id',
      as: 'parentArticle',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    Article.hasMany(models.Article, {
      foreignKey: 'parent_article_id',
      as: 'childArticles',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    Article.hasOne(models.ArticleDetail, {
      foreignKey: 'article_id',
      as: 'detail',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    Article.hasMany(models.ArticleMedia, {
      foreignKey: 'article_id',
      as: 'media',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    Article.hasMany(models.Comment, {
      foreignKey: 'article_id',
      as: 'comments',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    Article.hasMany(models.ArticleView, {
      foreignKey: 'article_id',
      as: 'views',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    Article.hasMany(models.ProductCard, {
      foreignKey: 'article_id',
      as: 'productCards',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    Article.hasOne(models.ProductCard, {
      foreignKey: 'linked_article_id',
      as: 'linkedProductCard',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    Article.hasMany(models.ArticleVersion, {
      foreignKey: 'article_id',
      as: 'versions',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    Article.hasMany(models.DiscussionForum, {
      foreignKey: 'article_id',
      as: 'discussionForums',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // Relasi wawasan ↔ teknis: artikel teknis mereferensi artikel wawasan
    Article.belongsTo(models.Article, {
      foreignKey: 'wawasan_article_id',
      as: 'wawasanArticle',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    Article.hasMany(models.Article, {
      foreignKey: 'wawasan_article_id',
      as: 'technicalArticles',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  };

  return Article;
};
