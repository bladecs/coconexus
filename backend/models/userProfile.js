'use strict';

module.exports = (sequelize, DataTypes) => {
  const UserProfile = sequelize.define(
    'UserProfile',
    {
      user_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      full_name: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      avatar_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      job_title: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      department: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      division: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      contributor_status: {
        type: DataTypes.ENUM('none', 'pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'none',
      },
      contributor_note: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      contributor_reviewed_by: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      contributor_reviewed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'UserProfile',
      timestamps: false,
    }
  );

  UserProfile.associate = (models) => {
    UserProfile.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  return UserProfile;
};
