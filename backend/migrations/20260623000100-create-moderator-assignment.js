'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('User', 'role', {
      type: Sequelize.ENUM('admin', 'pengelola', 'moderator', 'user'),
      allowNull: false,
      defaultValue: 'user',
    });

    await queryInterface.createTable('ModeratorAssignment', {
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'User',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      moderator_type: {
        type: Sequelize.ENUM('content', 'publication', 'forum', 'tag'),
        allowNull: false,
      },
      assigned_by: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'User',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ModeratorAssignment');
    await queryInterface.changeColumn('User', 'role', {
      type: Sequelize.ENUM('admin', 'pengelola', 'user'),
      allowNull: false,
      defaultValue: 'user',
    });
  },
};
