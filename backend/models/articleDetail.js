'use strict';

module.exports = (sequelize, DataTypes) => {
  const ArticleDetail = sequelize.define(
    'ArticleDetail',
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
        unique: true,
      },
      body_content: {
        type: DataTypes.TEXT('long'),
        allowNull: false,
      },
      meta_description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      sections: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      sources: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      difficulty_level: {
        type: DataTypes.ENUM('pemula', 'menengah', 'lanjutan'),
        allowNull: true,
      },
      time_required_minutes: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      materials_list: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      tools_list: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      process_parameters: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      quality_indicators: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      safety_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      prerequisite_article_ids: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      tableName: 'ArticleDetail',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  ArticleDetail.associate = (models) => {
    ArticleDetail.belongsTo(models.Article, {
      foreignKey: 'article_id',
      as: 'article',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  return ArticleDetail;
};
