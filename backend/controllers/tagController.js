'use strict';

const { Tag, Article } = require('../models');
const { badRequest, notFound } = require('../utils/httpErrors');
const { writeAuditLog } = require('../utils/auditLogger');

async function listAllTags(req, res, next) {
  try {
    const tags = await Tag.findAll({
      include: [
        {
          model: Article,
          as: 'articles',
          attributes: ['id', 'status'],
          through: { attributes: [] },
          required: false,
        },
      ],
      order: [['name', 'ASC']],
    });

    return res.status(200).json({
      success: true,
      message: 'Daftar tag berhasil diambil.',
      data: {
        tags: tags.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          article_count: (t.articles || []).length,
          published_count: (t.articles || []).filter((a) => a.status === 'published').length,
          created_at: t.created_at,
          updated_at: t.updated_at,
        })),
      },
    });
  } catch (err) {
    return next(err);
  }
}

async function deleteTag(req, res, next) {
  try {
    const tagId = Number(req.params.id);

    if (!Number.isInteger(tagId) || tagId <= 0) {
      throw badRequest('Parameter tag id tidak valid.');
    }

    const tag = await Tag.findByPk(tagId, {
      include: [
        {
          model: Article,
          as: 'articles',
          attributes: ['id'],
          through: { attributes: [] },
          required: false,
        },
      ],
    });

    if (!tag) throw notFound('Tag tidak ditemukan.');

    if (tag.articles && tag.articles.length > 0) {
      throw badRequest(`Tag "${tag.name}" masih digunakan oleh ${tag.articles.length} artikel dan tidak dapat dihapus.`);
    }

    await tag.destroy();

    await writeAuditLog({
      actorId: req.user.id,
      action: 'pengelola.delete_tag',
      entityType: 'tag',
      entityId: tagId,
      metadata: { name: tag.name },
    });

    return res.status(200).json({
      success: true,
      message: `Tag "${tag.name}" berhasil dihapus.`,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listAllTags, deleteTag };
