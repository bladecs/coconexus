'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ChatbotSetting', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      api_key: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      model: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: 'gemini-2.0-flash',
      },
      system_prompt: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      temperature: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: false,
        defaultValue: 0.70,
      },
      max_tokens: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 1024,
      },
      max_context_articles: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 3,
      },
      is_enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      welcome_message: {
        type: Sequelize.TEXT,
        allowNull: true,
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

  async down(queryInterface) {
    await queryInterface.dropTable('ChatbotSetting');
  },
};
