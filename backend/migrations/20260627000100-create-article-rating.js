'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ArticleRating', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      article_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'Article', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'User', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      rating: {
        type: Sequelize.TINYINT.UNSIGNED,
        allowNull: false,
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('ArticleRating', ['article_id', 'user_id'], {
      unique: true,
      name: 'uq_article_rating_user',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ArticleRating');
  },
};
