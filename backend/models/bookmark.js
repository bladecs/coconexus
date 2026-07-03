'use strict';

module.exports = (sequelize, DataTypes) => {
  const Bookmark = sequelize.define(
    'Bookmark',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      article_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
    },
    {
      tableName: 'Bookmark',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [{ unique: true, fields: ['user_id', 'article_id'] }],
    }
  );

  Bookmark.associate = (models) => {
    Bookmark.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
    });
    Bookmark.belongsTo(models.Article, {
      foreignKey: 'article_id',
      as: 'article',
      onDelete: 'CASCADE',
    });
  };

  return Bookmark;
};
