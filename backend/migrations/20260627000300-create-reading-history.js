'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ReadingHistory', {
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
      read_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('ReadingHistory', ['user_id', 'article_id'], {
      unique: true,
      name: 'uq_reading_history_user_article',
    });
    await queryInterface.addIndex('ReadingHistory', ['user_id', 'read_at'], {
      name: 'idx_reading_history_user_read_at',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ReadingHistory');
  },
};
