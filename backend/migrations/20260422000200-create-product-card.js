'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // create table only if it does not yet exist
    const tableDef = await queryInterface.describeTable('ProductCard').catch(() => null);
    if (!tableDef) {
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

      try {
        await queryInterface.addIndex('ProductCard', ['article_id'], {
          name: 'product_card_article_id_idx',
        });
      } catch (e) {
        // ignore if index exists
      }

      try {
        await queryInterface.addIndex('ProductCard', ['linked_article_id'], {
          name: 'product_card_linked_article_id_idx',
          unique: true,
        });
      } catch (e) {
        // ignore if index exists
      }
    } else {
      // table exists; ensure indexes are present (best effort)
      try {
        await queryInterface.addIndex('ProductCard', ['article_id'], { name: 'product_card_article_id_idx' });
      } catch (e) {}
      try {
        await queryInterface.addIndex('ProductCard', ['linked_article_id'], { name: 'product_card_linked_article_id_idx', unique: true });
      } catch (e) {}
    }
  },

  async down(queryInterface) {
    // remove indexes/table if present
    const tableDef = await queryInterface.describeTable('ProductCard').catch(() => null);
    if (tableDef) {
      try {
        await queryInterface.removeIndex('ProductCard', 'product_card_linked_article_id_idx');
      } catch (e) {}
      try {
        await queryInterface.removeIndex('ProductCard', 'product_card_article_id_idx');
      } catch (e) {}
      try {
        await queryInterface.dropTable('ProductCard');
      } catch (e) {}
    }
  },
};
