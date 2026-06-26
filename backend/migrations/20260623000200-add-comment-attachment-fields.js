'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Comment', 'attachment_name', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn('Comment', 'attachment_path', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn('Comment', 'attachment_mime_type', {
      type: Sequelize.STRING(120),
      allowNull: true,
    });
    await queryInterface.addColumn('Comment', 'attachment_size', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Comment', 'attachment_size');
    await queryInterface.removeColumn('Comment', 'attachment_mime_type');
    await queryInterface.removeColumn('Comment', 'attachment_path');
    await queryInterface.removeColumn('Comment', 'attachment_name');
  },
};
