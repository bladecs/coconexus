'use strict';

module.exports = (sequelize, DataTypes) => {
  const DiscussionForum = sequelize.define(
    'DiscussionForum',
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
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      summary: {
        type: DataTypes.STRING(1000),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('draft', 'validated', 'active', 'closed'),
        allowNull: false,
        defaultValue: 'draft',
      },
      created_by_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      validated_by_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      validated_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      notes: {
        type: DataTypes.STRING(1000),
        allowNull: true,
      },
    },
    {
      tableName: 'DiscussionForum',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  DiscussionForum.associate = (models) => {
    DiscussionForum.belongsTo(models.Article, {
      foreignKey: 'article_id',
      as: 'article',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    DiscussionForum.belongsTo(models.User, {
      foreignKey: 'created_by_id',
      as: 'creator',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    DiscussionForum.belongsTo(models.User, {
      foreignKey: 'validated_by_id',
      as: 'validator',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    DiscussionForum.hasMany(models.DiscussionForumSourceComment, {
      foreignKey: 'discussion_forum_id',
      as: 'sourceLinks',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    DiscussionForum.hasMany(models.Comment, {
      foreignKey: 'discussion_forum_id',
      as: 'comments',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  return DiscussionForum;
};
