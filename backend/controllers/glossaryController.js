'use strict';

const { GlossaryTerm } = require('../models');
const { Op } = require('sequelize');

function badRequest(msg) {
  const err = new Error(msg);
  err.statusCode = 400;
  return err;
}

function notFound(msg) {
  const err = new Error(msg);
  err.statusCode = 404;
  return err;
}

const VALID_CATEGORIES = ['kimia', 'proses', 'kualitas', 'alat', 'umum'];

async function listGlossaryTerms(req, res, next) {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
    const offset = (page - 1) * limit;

    const where = {};

    if (search) {
      where[Op.or] = [
        { term: { [Op.like]: `%${search}%` } },
        { definition: { [Op.like]: `%${search}%` } },
      ];
    }

    if (category && VALID_CATEGORIES.includes(category)) {
      where.category = category;
    }

    const { count, rows } = await GlossaryTerm.findAndCountAll({
      where,
      order: [['term', 'ASC']],
      limit,
      offset,
      attributes: ['id', 'term', 'definition', 'category', 'standard_reference', 'related_article_ids', 'created_at'],
    });

    return res.status(200).json({
      success: true,
      data: {
        terms: rows,
        meta: {
          page,
          limit,
          total_items: count,
          total_pages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getGlossaryTerm(req, res, next) {
  try {
    const term = await GlossaryTerm.findByPk(req.params.id);
    if (!term) throw notFound('Istilah tidak ditemukan.');

    return res.status(200).json({ success: true, data: { term } });
  } catch (error) {
    return next(error);
  }
}

async function createGlossaryTerm(req, res, next) {
  try {
    const termText = typeof req.body.term === 'string' ? req.body.term.trim() : '';
    const definition = typeof req.body.definition === 'string' ? req.body.definition.trim() : '';
    const category = VALID_CATEGORIES.includes(req.body.category) ? req.body.category : 'umum';
    const standardReference = typeof req.body.standard_reference === 'string' ? req.body.standard_reference.trim() || null : null;
    const relatedArticleIds = Array.isArray(req.body.related_article_ids) ? req.body.related_article_ids : null;

    if (!termText) throw badRequest('term wajib diisi.');
    if (!definition) throw badRequest('definition wajib diisi.');

    const existing = await GlossaryTerm.findOne({ where: { term: termText } });
    if (existing) throw badRequest(`Istilah "${termText}" sudah ada.`);

    const created = await GlossaryTerm.create({
      term: termText,
      definition,
      category,
      standard_reference: standardReference,
      related_article_ids: relatedArticleIds,
      created_by: req.user.id,
    });

    return res.status(201).json({ success: true, data: { term: created } });
  } catch (error) {
    return next(error);
  }
}

async function updateGlossaryTerm(req, res, next) {
  try {
    const term = await GlossaryTerm.findByPk(req.params.id);
    if (!term) throw notFound('Istilah tidak ditemukan.');

    if (req.body.term !== undefined) {
      const newTerm = req.body.term.trim();
      if (!newTerm) throw badRequest('term tidak boleh kosong.');
      const conflict = await GlossaryTerm.findOne({ where: { term: newTerm, id: { [Op.ne]: term.id } } });
      if (conflict) throw badRequest(`Istilah "${newTerm}" sudah ada.`);
      term.term = newTerm;
    }
    if (req.body.definition !== undefined) {
      if (!req.body.definition.trim()) throw badRequest('definition tidak boleh kosong.');
      term.definition = req.body.definition.trim();
    }
    if (VALID_CATEGORIES.includes(req.body.category)) term.category = req.body.category;
    if (req.body.standard_reference !== undefined) term.standard_reference = req.body.standard_reference || null;
    if (req.body.related_article_ids !== undefined) {
      term.related_article_ids = Array.isArray(req.body.related_article_ids) ? req.body.related_article_ids : null;
    }

    await term.save();

    return res.status(200).json({ success: true, data: { term } });
  } catch (error) {
    return next(error);
  }
}

async function deleteGlossaryTerm(req, res, next) {
  try {
    const term = await GlossaryTerm.findByPk(req.params.id);
    if (!term) throw notFound('Istilah tidak ditemukan.');

    await term.destroy();

    return res.status(200).json({ success: true, message: 'Istilah berhasil dihapus.' });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listGlossaryTerms,
  getGlossaryTerm,
  createGlossaryTerm,
  updateGlossaryTerm,
  deleteGlossaryTerm,
};
