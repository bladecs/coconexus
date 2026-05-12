'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ArticleDetail', 'sections', {
      type: Sequelize.JSON,
      allowNull: true,
    });

    await queryInterface.addColumn('ArticleDetail', 'sources', {
      type: Sequelize.JSON,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('ArticleDetail', 'sources');
    await queryInterface.removeColumn('ArticleDetail', 'sections');
  },
};
