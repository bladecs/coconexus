'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDef = await queryInterface.describeTable('ArticleDetail').catch(() => null);
    if (!tableDef || !Object.prototype.hasOwnProperty.call(tableDef, 'sections')) {
      await queryInterface.addColumn('ArticleDetail', 'sections', {
        type: Sequelize.JSON,
        allowNull: true,
      });
    }

    if (!tableDef || !Object.prototype.hasOwnProperty.call(tableDef, 'sources')) {
      await queryInterface.addColumn('ArticleDetail', 'sources', {
        type: Sequelize.JSON,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const tableDef = await queryInterface.describeTable('ArticleDetail').catch(() => null);
    if (tableDef && Object.prototype.hasOwnProperty.call(tableDef, 'sources')) {
      try {
        await queryInterface.removeColumn('ArticleDetail', 'sources');
      } catch (e) {}
    }
    if (tableDef && Object.prototype.hasOwnProperty.call(tableDef, 'sections')) {
      try {
        await queryInterface.removeColumn('ArticleDetail', 'sections');
      } catch (e) {}
    }
  },
};
