'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ProductCard', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      article_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'Article',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      image: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      linked_article_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        unique: true,
        references: {
          model: 'Article',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('ProductCard', ['article_id'], {
      name: 'product_card_article_id_idx',
    });

    await queryInterface.addIndex('ProductCard', ['linked_article_id'], {
      name: 'product_card_linked_article_id_idx',
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('ProductCard', 'product_card_linked_article_id_idx');
    await queryInterface.removeIndex('ProductCard', 'product_card_article_id_idx');
    await queryInterface.dropTable('ProductCard');
  },
};
