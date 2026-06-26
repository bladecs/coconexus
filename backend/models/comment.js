'use strict';

module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define(
    'Comment',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      body: {
        type: DataTypes.STRING(1000),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
      user_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      article_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      discussion_forum_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      parent_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      attachment_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      attachment_path: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      attachment_mime_type: {
        type: DataTypes.STRING(120),
        allowNull: true,
      },
      attachment_size: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
    },
    {
      tableName: 'Comment',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  Comment.associate = (models) => {
    Comment.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    Comment.belongsTo(models.Article, {
      foreignKey: 'article_id',
      as: 'article',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    Comment.belongsTo(models.DiscussionForum, {
      foreignKey: 'discussion_forum_id',
      as: 'discussionForum',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    Comment.belongsTo(models.Comment, {
      foreignKey: 'parent_id',
      as: 'parent',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    Comment.hasMany(models.Comment, {
      foreignKey: 'parent_id',
      as: 'replies',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    Comment.hasMany(models.DiscussionForumSourceComment, {
      foreignKey: 'comment_id',
      as: 'forumSourceLinks',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  return Comment;
};
