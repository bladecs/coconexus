'use strict';

module.exports = (sequelize, DataTypes) => {
  const ArticleMedia = sequelize.define(
    'ArticleMedia',
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
      file_path: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      media_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
    },
    {
      tableName: 'ArticleMedia',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  ArticleMedia.associate = (models) => {
    ArticleMedia.belongsTo(models.Article, {
      foreignKey: 'article_id',
      as: 'article',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  return ArticleMedia;
};
