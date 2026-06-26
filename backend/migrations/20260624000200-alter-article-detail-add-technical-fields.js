'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ArticleDetail', 'difficulty_level', {
      type: Sequelize.ENUM('pemula', 'menengah', 'lanjutan'),
      allowNull: true,
      defaultValue: null,
      after: 'sources',
    });

    await queryInterface.addColumn('ArticleDetail', 'time_required_minutes', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: null,
      after: 'difficulty_level',
    });

    await queryInterface.addColumn('ArticleDetail', 'materials_list', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: null,
      after: 'time_required_minutes',
    });

    await queryInterface.addColumn('ArticleDetail', 'tools_list', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: null,
      after: 'materials_list',
    });

    await queryInterface.addColumn('ArticleDetail', 'process_parameters', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: null,
      after: 'tools_list',
    });

    await queryInterface.addColumn('ArticleDetail', 'quality_indicators', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: null,
      after: 'process_parameters',
    });

    await queryInterface.addColumn('ArticleDetail', 'safety_notes', {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: null,
      after: 'quality_indicators',
    });

    await queryInterface.addColumn('ArticleDetail', 'prerequisite_article_ids', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: null,
      after: 'safety_notes',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('ArticleDetail', 'prerequisite_article_ids');
    await queryInterface.removeColumn('ArticleDetail', 'safety_notes');
    await queryInterface.removeColumn('ArticleDetail', 'quality_indicators');
    await queryInterface.removeColumn('ArticleDetail', 'process_parameters');
    await queryInterface.removeColumn('ArticleDetail', 'tools_list');
    await queryInterface.removeColumn('ArticleDetail', 'materials_list');
    await queryInterface.removeColumn('ArticleDetail', 'time_required_minutes');
    await queryInterface.removeColumn('ArticleDetail', 'difficulty_level');
  },
};
