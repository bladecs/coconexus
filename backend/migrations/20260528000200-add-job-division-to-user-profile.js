'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDef = await queryInterface.describeTable('UserProfile').catch(() => null);
    if (!tableDef || !Object.prototype.hasOwnProperty.call(tableDef, 'job_title')) {
      await queryInterface.addColumn('UserProfile', 'job_title', {
        type: Sequelize.STRING(100),
        allowNull: true,
      });
    }

    if (!tableDef || !Object.prototype.hasOwnProperty.call(tableDef, 'department')) {
      await queryInterface.addColumn('UserProfile', 'department', {
        type: Sequelize.STRING(100),
        allowNull: true,
      });
    }

    if (!tableDef || !Object.prototype.hasOwnProperty.call(tableDef, 'division')) {
      await queryInterface.addColumn('UserProfile', 'division', {
        type: Sequelize.STRING(100),
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const tableDef = await queryInterface.describeTable('UserProfile').catch(() => null);
    if (tableDef && Object.prototype.hasOwnProperty.call(tableDef, 'job_title')) {
      try { await queryInterface.removeColumn('UserProfile', 'job_title'); } catch (e) {}
    }
    if (tableDef && Object.prototype.hasOwnProperty.call(tableDef, 'department')) {
      try { await queryInterface.removeColumn('UserProfile', 'department'); } catch (e) {}
    }
    if (tableDef && Object.prototype.hasOwnProperty.call(tableDef, 'division')) {
      try { await queryInterface.removeColumn('UserProfile', 'division'); } catch (e) {}
    }
  },
};
