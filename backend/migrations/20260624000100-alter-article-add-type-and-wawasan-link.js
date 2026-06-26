'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Article', 'article_type', {
      type: Sequelize.ENUM('main', 'detail', 'prosedur', 'panduan', 'referensi', 'studi_kasus', 'troubleshooting'),
      allowNull: false,
      defaultValue: 'main',
      after: 'parent_article_id',
    });

    // Backfill: artikel yang punya parent_article_id adalah 'detail', sisanya 'main'
    await queryInterface.sequelize.query(
      `UPDATE Article SET article_type = CASE WHEN parent_article_id IS NOT NULL THEN 'detail' ELSE 'main' END`
    );

    await queryInterface.addColumn('Article', 'wawasan_article_id', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: null,
      after: 'article_type',
      references: {
        model: 'Article',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Article', 'wawasan_article_id');
    await queryInterface.removeColumn('Article', 'article_type');
  },
};
