'use strict';

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
          notEmpty: true,
        },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      role: {
        type: DataTypes.ENUM('admin', 'pengelola', 'moderator', 'user'),
        allowNull: false,
        defaultValue: 'user',
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'deleted_at',
      },
    },
    {
      tableName: 'User',
      timestamps: true,
      paranoid: true,
      deletedAt: 'deleted_at',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  User.associate = (models) => {
    User.hasOne(models.UserProfile, {
      foreignKey: 'user_id',
      as: 'profile',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    User.hasOne(models.ModeratorAssignment, {
      foreignKey: 'user_id',
      as: 'moderatorAssignment',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    User.hasMany(models.Article, {
      foreignKey: 'author_id',
      as: 'articles',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    User.hasMany(models.Comment, {
      foreignKey: 'user_id',
      as: 'comments',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    User.hasMany(models.DiscussionForum, {
      foreignKey: 'created_by_id',
      as: 'createdForums',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    User.hasMany(models.DiscussionForum, {
      foreignKey: 'validated_by_id',
      as: 'validatedForums',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    User.hasMany(models.ArticleView, {
      foreignKey: 'user_id',
      as: 'articleViews',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  };

  return User;
};
