'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. TAMBAHAN: Insert data kategori wajib terlebih dahulu
      await queryInterface.bulkInsert('Category', [
        { id: 1, name: 'Batok Kelapa', description: 'Kategori pengolahan batok kelapa', created_at: new Date(), updated_at: new Date() },
        { id: 2, name: 'Serabut Kelapa', description: 'Kategori pengolahan serabut kelapa', created_at: new Date(), updated_at: new Date() },
        { id: 3, name: 'Kulit Kelapa', description: 'Kategori pengolahan kulit kelapa', created_at: new Date(), updated_at: new Date() }
      ], { transaction, ignoreDuplicates: true });

      // 2. PERBAIKAN: Gunakan nama constraint asli dari database (article_ibfk_2)
      await queryInterface.removeConstraint('Article', 'article_ibfk_2', { transaction });

      // 3. Tambahkan constraint baru
      await queryInterface.addConstraint('Article', {
        fields: ['category_id'],
        type: 'foreign key',
        name: 'Article_category_id_fkey',
        references: {
          table: 'Category',
          field: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeConstraint('Article', 'Article_category_id_fkey', { transaction });

      // Revert ke constraint lama
      await queryInterface.addConstraint('Article', {
        fields: ['category_id'],
        type: 'foreign key',
        name: 'article_ibfk_2',
        references: {
          table: 'Category',
          field: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
