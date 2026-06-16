'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Make this migration idempotent: only add column/index if not present
    const tableDef = await queryInterface.describeTable('Article').catch(() => null);
    if (!tableDef || !Object.prototype.hasOwnProperty.call(tableDef, 'parent_article_id')) {
      await queryInterface.addColumn('Article', 'parent_article_id', {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'Article',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        after: 'category_id',
      });

      // attempt to create index; if it exists, ignore the error
      try {
        await queryInterface.addIndex('Article', ['parent_article_id'], {
          name: 'article_parent_article_id_idx',
        });
      } catch (e) {
        // index likely already exists; ignore
      }
    }
  },

  async down(queryInterface) {
    // Only remove index/column if they exist
    const tableDef = await queryInterface.describeTable('Article').catch(() => null);
    if (tableDef && Object.prototype.hasOwnProperty.call(tableDef, 'parent_article_id')) {
      try {
        await queryInterface.removeIndex('Article', 'article_parent_article_id_idx');
      } catch (e) {
        // ignore if index does not exist
      }

      try {
        await queryInterface.removeColumn('Article', 'parent_article_id');
      } catch (e) {
        // ignore if column removal fails
      }
    }
  },
};
