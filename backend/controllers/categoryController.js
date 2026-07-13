'use strict';

const { Category, Article } = require('../models');
const { Op } = require('sequelize');
const { badRequest, notFound, conflict } = require('../utils/httpErrors');
const { writeAuditLog } = require('../utils/auditLogger');

async function listCategories(req, res, next) {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const where = search
      ? {
          [Op.or]: [
            { name: { [Op.like]: `%${search}%` } },
            { description: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

    const categories = await Category.findAll({
      where,
      include: [
        {
          model: Article,
          as: 'articles',
          attributes: ['id'],
          required: false,
        },
      ],
      order: [['name', 'ASC']],
    });

    return res.status(200).json({
      success: true,
      message: 'Daftar kategori berhasil diambil.',
      data: {
        categories: categories.map((category) => ({
          id: category.id,
          name: category.name,
          description: category.description,
          created_at: category.created_at,
          updated_at: category.updated_at,
          article_count: category.articles?.length || 0,
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function createCategory(req, res, next) {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const description = typeof req.body.description === 'string' ? req.body.description.trim() : null;

    if (!name) {
      throw badRequest('Nama kategori wajib diisi.');
    }

    const existingCategory = await Category.findOne({
      where: { name },
    });

    if (existingCategory) {
      throw conflict('Nama kategori sudah digunakan.');
    }

    const category = await Category.create({
      name,
      description,
    });

    await writeAuditLog({
      actorId: req.user.id,
      action: 'tag.create_category',
      entityType: 'category',
      entityId: category.id,
      metadata: { name },
    });

    return res.status(201).json({
      success: true,
      message: 'Kategori berhasil dibuat.',
      data: {
        category,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function updateCategory(req, res, next) {
  try {
    const categoryId = Number(req.params.id);
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const description = typeof req.body.description === 'string' ? req.body.description.trim() : null;

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      throw badRequest('Parameter kategori tidak valid.');
    }

    if (!name) {
      throw badRequest('Nama kategori wajib diisi.');
    }

    const category = await Category.findByPk(categoryId);

    if (!category) {
      throw notFound('Kategori tidak ditemukan.');
    }

    const duplicateCategory = await Category.findOne({
      where: {
        name,
        id: {
          [Op.ne]: categoryId,
        },
      },
    });

    if (duplicateCategory) {
      throw conflict('Nama kategori sudah digunakan kategori lain.');
    }

    category.name = name;
    category.description = description;
    await category.save();

    await writeAuditLog({
      actorId: req.user.id,
      action: 'tag.update_category',
      entityType: 'category',
      entityId: category.id,
      metadata: { name },
    });

    return res.status(200).json({
      success: true,
      message: 'Kategori berhasil diperbarui.',
      data: {
        category,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const categoryId = Number(req.params.id);

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      throw badRequest('Parameter kategori tidak valid.');
    }

    const category = await Category.findByPk(categoryId, {
      include: [
        {
          model: Article,
          as: 'articles',
          attributes: ['id'],
        },
      ],
    });

    if (!category) {
      throw notFound('Kategori tidak ditemukan.');
    }

    if (category.articles?.length) {
      throw conflict('Kategori tidak dapat dihapus karena masih digunakan artikel.');
    }

    await category.destroy();

    await writeAuditLog({
      actorId: req.user.id,
      action: 'tag.delete_category',
      entityType: 'category',
      entityId: categoryId,
      metadata: { name: category.name },
    });

    return res.status(200).json({
      success: true,
      message: 'Kategori berhasil dihapus.',
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
