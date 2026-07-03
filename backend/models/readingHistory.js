'use strict';

module.exports = (sequelize, DataTypes) => {
  const ReadingHistory = sequelize.define(
    'ReadingHistory',
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, autoIncrement: true, primaryKey: true },
      user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      article_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      read_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    {
      tableName: 'ReadingHistory',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [{ unique: true, fields: ['user_id', 'article_id'] }],
    }
  );

  ReadingHistory.associate = (models) => {
    ReadingHistory.belongsTo(models.User, { foreignKey: 'user_id', as: 'user', onDelete: 'CASCADE' });
    ReadingHistory.belongsTo(models.Article, { foreignKey: 'article_id', as: 'article', onDelete: 'CASCADE' });
  };

  return ReadingHistory;
};
