'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Comment', 'status', {
      type: Sequelize.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    });

    await queryInterface.sequelize.query("UPDATE `Comment` SET `status` = 'approved'");
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Comment', 'status');
  },
};
