'use strict';

module.exports = (sequelize, DataTypes) => {
  const GlossaryTerm = sequelize.define(
    'GlossaryTerm',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      term: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        validate: { notEmpty: true },
      },
      definition: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: { notEmpty: true },
      },
      category: {
        type: DataTypes.ENUM('kimia', 'proses', 'kualitas', 'alat', 'umum'),
        allowNull: false,
        defaultValue: 'umum',
      },
      standard_reference: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      related_article_ids: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      created_by: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
    },
    {
      tableName: 'GlossaryTerm',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  GlossaryTerm.associate = (models) => {
    GlossaryTerm.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  };

  return GlossaryTerm;
};
