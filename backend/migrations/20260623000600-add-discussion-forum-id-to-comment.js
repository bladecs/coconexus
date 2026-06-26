'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Comment', 'discussion_forum_id', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'DiscussionForum',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      after: 'article_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Comment', 'discussion_forum_id');
  },
};
