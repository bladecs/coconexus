'use strict';

module.exports = (sequelize, DataTypes) => {
  const DiscussionForumSourceComment = sequelize.define(
    'DiscussionForumSourceComment',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      discussion_forum_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      comment_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      note: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
    },
    {
      tableName: 'DiscussionForumSourceComment',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          unique: true,
          fields: ['discussion_forum_id', 'comment_id'],
        },
      ],
    }
  );

  DiscussionForumSourceComment.associate = (models) => {
    DiscussionForumSourceComment.belongsTo(models.DiscussionForum, {
      foreignKey: 'discussion_forum_id',
      as: 'forum',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    DiscussionForumSourceComment.belongsTo(models.Comment, {
      foreignKey: 'comment_id',
      as: 'comment',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  return DiscussionForumSourceComment;
};
