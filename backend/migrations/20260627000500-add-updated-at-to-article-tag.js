'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('ArticleTag').catch(() => null);
    if (tableDescription && !tableDescription.updated_at) {
      await queryInterface.addColumn('ArticleTag', 'updated_at', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      });
    }
  },

  async down(queryInterface) {
    const tableDescription = await queryInterface.describeTable('ArticleTag').catch(() => null);
    if (tableDescription && tableDescription.updated_at) {
      await queryInterface.removeColumn('ArticleTag', 'updated_at');
    }
  },
};
