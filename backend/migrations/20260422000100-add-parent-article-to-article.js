'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
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

    await queryInterface.addIndex('Article', ['parent_article_id'], {
      name: 'article_parent_article_id_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('Article', 'article_parent_article_id_idx');
    await queryInterface.removeColumn('Article', 'parent_article_id');
  },
};
