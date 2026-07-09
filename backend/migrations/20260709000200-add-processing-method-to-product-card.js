'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ProductCard', 'processing_method', {
      type: Sequelize.STRING(150),
      allowNull: true,
      after: 'description',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('ProductCard', 'processing_method');
  },
};
