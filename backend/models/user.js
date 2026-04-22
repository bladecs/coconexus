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
        type: DataTypes.ENUM('admin', 'user'),
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
  };

  return User;
};
