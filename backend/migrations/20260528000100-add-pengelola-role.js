'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Change the ENUM type to add 'pengelola' role
    await queryInterface.changeColumn('User', 'role', {
      type: Sequelize.ENUM('admin', 'pengelola', 'user'),
      allowNull: false,
      defaultValue: 'user',
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert to original ENUM
    await queryInterface.changeColumn('User', 'role', {
      type: Sequelize.ENUM('admin', 'user'),
      allowNull: false,
      defaultValue: 'user',
    });
  },
};
