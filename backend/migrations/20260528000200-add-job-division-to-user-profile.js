'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('UserProfile', 'job_title', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    await queryInterface.addColumn('UserProfile', 'department', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    await queryInterface.addColumn('UserProfile', 'division', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('UserProfile', 'job_title');
    await queryInterface.removeColumn('UserProfile', 'department');
    await queryInterface.removeColumn('UserProfile', 'division');
  },
};
