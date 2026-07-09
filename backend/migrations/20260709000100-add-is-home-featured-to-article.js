'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Article', 'is_home_featured', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      after: 'article_type',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Article', 'is_home_featured');
  },
};
