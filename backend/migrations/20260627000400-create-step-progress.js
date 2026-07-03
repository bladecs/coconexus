'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('StepProgress', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'User', key: 'id' },
        onDelete: 'CASCADE',
      },
      article_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'Article', key: 'id' },
        onDelete: 'CASCADE',
      },
      step_index: {
        type: Sequelize.SMALLINT.UNSIGNED,
        allowNull: false,
      },
      completed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('StepProgress', ['user_id', 'article_id', 'step_index'], {
      unique: true,
      name: 'uq_step_progress',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('StepProgress');
  },
};
