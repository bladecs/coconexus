'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ArticleTag', {
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
      tag_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'Tag',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        // UBAH BAGIAN INI MENJADI CASCADE
        onDelete: 'CASCADE', 
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addConstraint('ArticleTag', {
      fields: ['article_id', 'tag_id'],
      type: 'unique',
      name: 'unique_article_tag',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ArticleTag');
  },
};