'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ArticleVersion', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      article_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'Article',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      version_number: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      source_version_number: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      },
      action: {
        type: Sequelize.ENUM('create', 'update', 'status_change', 'publish_version'),
        allowNull: false,
      },
      snapshot: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      actor_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'User',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('ArticleVersion', ['article_id', 'version_number'], {
      unique: true,
      name: 'article_version_unique_version',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ArticleVersion');
  },
};
