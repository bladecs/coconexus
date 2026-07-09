'use strict';

module.exports = (sequelize, DataTypes) => {
  const ProductCard = sequelize.define(
    'ProductCard',
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
        validate: {
          notEmpty: true,
        },
      },
      description: {
        type: DataTypes.STRING(500),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      processing_method: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      image: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      linked_article_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        unique: true,
      },
    },
    {
      tableName: 'ProductCard',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  ProductCard.associate = (models) => {
    ProductCard.belongsTo(models.Article, {
      foreignKey: 'article_id',
      as: 'article',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    ProductCard.belongsTo(models.Article, {
      foreignKey: 'linked_article_id',
      as: 'linkedArticle',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  };

  return ProductCard;
};
