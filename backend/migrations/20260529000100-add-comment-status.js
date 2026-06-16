'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDef = await queryInterface.describeTable('Comment').catch(() => null);
    if (!tableDef || !Object.prototype.hasOwnProperty.call(tableDef, 'status')) {
      await queryInterface.addColumn('Comment', 'status', {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      });

      await queryInterface.sequelize.query("UPDATE `Comment` SET `status` = 'approved'");
    }
  },

  async down(queryInterface) {
    const tableDef = await queryInterface.describeTable('Comment').catch(() => null);
    if (tableDef && Object.prototype.hasOwnProperty.call(tableDef, 'status')) {
      try { await queryInterface.removeColumn('Comment', 'status'); } catch (e) {}
    }
  },
};
