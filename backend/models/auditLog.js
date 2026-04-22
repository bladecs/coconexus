'use strict';

module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define(
    'AuditLog',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      actor_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      action: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      entity_type: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      entity_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      tableName: 'AuditLog',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
    }
  );

  AuditLog.associate = (models) => {
    AuditLog.belongsTo(models.User, {
      foreignKey: 'actor_id',
      as: 'actor',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  return AuditLog;
};
