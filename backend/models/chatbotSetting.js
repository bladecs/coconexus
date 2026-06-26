'use strict';

module.exports = (sequelize, DataTypes) => {
  const ChatbotSetting = sequelize.define(
    'ChatbotSetting',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      api_key: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      model: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'gemini-2.0-flash',
      },
      system_prompt: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      temperature: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: false,
        defaultValue: 0.70,
      },
      max_tokens: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 1024,
      },
      max_context_articles: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 3,
      },
      is_enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      welcome_message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'ChatbotSetting',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return ChatbotSetting;
};
