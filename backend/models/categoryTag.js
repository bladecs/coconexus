'use strict';

module.exports = (sequelize, DataTypes) => {
  const CategoryTag = sequelize.define(
    'CategoryTag',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
        },
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      tableName: 'CategoryTag',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  CategoryTag.associate = (models) => {
    CategoryTag.hasMany(models.Article, {
      foreignKey: 'category_id',
      as: 'articles',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
  };

  return CategoryTag;
};
