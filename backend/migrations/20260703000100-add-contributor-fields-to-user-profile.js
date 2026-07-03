'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('UserProfile', 'contributor_status', {
      type: Sequelize.ENUM('none', 'pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'none',
      after: 'division',
    });

    await queryInterface.addColumn('UserProfile', 'contributor_note', {
      type: Sequelize.TEXT,
      allowNull: true,
      after: 'contributor_status',
    });

    await queryInterface.addColumn('UserProfile', 'contributor_reviewed_by', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'User', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      after: 'contributor_note',
    });

    await queryInterface.addColumn('UserProfile', 'contributor_reviewed_at', {
      type: Sequelize.DATE,
      allowNull: true,
      after: 'contributor_reviewed_by',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('UserProfile', 'contributor_reviewed_at');
    await queryInterface.removeColumn('UserProfile', 'contributor_reviewed_by');
    await queryInterface.removeColumn('UserProfile', 'contributor_note');
    await queryInterface.removeColumn('UserProfile', 'contributor_status');
  },
};
