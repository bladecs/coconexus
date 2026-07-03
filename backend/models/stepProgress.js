'use strict';

module.exports = (sequelize, DataTypes) => {
  const StepProgress = sequelize.define(
    'StepProgress',
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, autoIncrement: true, primaryKey: true },
      user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      article_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      step_index: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
      completed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      tableName: 'StepProgress',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [{ unique: true, fields: ['user_id', 'article_id', 'step_index'] }],
    }
  );

  StepProgress.associate = (models) => {
    StepProgress.belongsTo(models.User, { foreignKey: 'user_id', as: 'user', onDelete: 'CASCADE' });
    StepProgress.belongsTo(models.Article, { foreignKey: 'article_id', as: 'article', onDelete: 'CASCADE' });
  };

  return StepProgress;
};
