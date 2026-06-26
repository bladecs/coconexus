'use strict';

module.exports = (sequelize, DataTypes) => {
  const ModeratorAssignment = sequelize.define(
    'ModeratorAssignment',
    {
      user_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      moderator_type: {
        type: DataTypes.ENUM('content', 'publication', 'forum', 'tag'),
        allowNull: false,
      },
      assigned_by: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
    },
    {
      tableName: 'ModeratorAssignment',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  ModeratorAssignment.associate = (models) => {
    ModeratorAssignment.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    ModeratorAssignment.belongsTo(models.User, {
      foreignKey: 'assigned_by',
      as: 'assigner',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  };

  return ModeratorAssignment;
};
