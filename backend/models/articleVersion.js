'use strict';

module.exports = (sequelize, DataTypes) => {
  const ArticleVersion = sequelize.define(
    'ArticleVersion',
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
      version_number: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      source_version_number: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      action: {
        type: DataTypes.ENUM('create', 'update', 'status_change', 'publish_version'),
        allowNull: false,
      },
      snapshot: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      actor_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
    },
    {
      tableName: 'ArticleVersion',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          unique: true,
          fields: ['article_id', 'version_number'],
        },
      ],
    }
  );

  ArticleVersion.associate = (models) => {
    ArticleVersion.belongsTo(models.Article, {
      foreignKey: 'article_id',
      as: 'article',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    ArticleVersion.belongsTo(models.User, {
      foreignKey: 'actor_id',
      as: 'actor',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  };

  return ArticleVersion;
};
