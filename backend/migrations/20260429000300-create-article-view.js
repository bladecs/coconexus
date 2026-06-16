'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDef = await queryInterface.describeTable('ArticleView').catch(() => null);
    if (!tableDef) {
      await queryInterface.createTable('ArticleView', {
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
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'User',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      session_id: {
        type: Sequelize.STRING(120),
        allowNull: true,
      },
      ip_hash: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },
      user_agent: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      read_duration_seconds: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
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

      try {
        await queryInterface.addIndex('ArticleView', ['article_id', 'created_at'], {
          name: 'idx_article_view_article_created_at',
        });
      } catch (e) {}
      try {
        await queryInterface.addIndex('ArticleView', ['user_id', 'created_at'], {
          name: 'idx_article_view_user_created_at',
        });
      } catch (e) {}
      try {
        await queryInterface.addIndex('ArticleView', ['session_id', 'created_at'], {
          name: 'idx_article_view_session_created_at',
        });
      } catch (e) {}
    } else {
      // ensure indexes exist (best-effort)
      try { await queryInterface.addIndex('ArticleView', ['article_id', 'created_at'], { name: 'idx_article_view_article_created_at' }); } catch (e) {}
      try { await queryInterface.addIndex('ArticleView', ['user_id', 'created_at'], { name: 'idx_article_view_user_created_at' }); } catch (e) {}
      try { await queryInterface.addIndex('ArticleView', ['session_id', 'created_at'], { name: 'idx_article_view_session_created_at' }); } catch (e) {}
    }
  },

  async down(queryInterface) {
    const tableDef = await queryInterface.describeTable('ArticleView').catch(() => null);
    if (tableDef) {
      try {
        await queryInterface.dropTable('ArticleView');
      } catch (e) {}
    }
  },
};
