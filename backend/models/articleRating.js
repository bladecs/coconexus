'use strict';

module.exports = (sequelize, DataTypes) => {
  const ArticleRating = sequelize.define(
    'ArticleRating',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      article_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      rating: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: false,
        validate: { min: 1, max: 5 },
      },
    },
    {
      tableName: 'ArticleRating',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [{ unique: true, fields: ['article_id', 'user_id'] }],
    }
  );

  ArticleRating.associate = (models) => {
    ArticleRating.belongsTo(models.Article, {
      foreignKey: 'article_id',
      as: 'article',
      onDelete: 'CASCADE',
    });
    ArticleRating.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
    });
  };

  return ArticleRating;
};
