'use strict';

const { StepProgress, Article } = require('../models');
const { badRequest, notFound } = require('../utils/httpErrors');

async function getProgress(req, res, next) {
  try {
    const articleId = Number(req.params.articleId);
    if (!Number.isInteger(articleId) || articleId <= 0) throw badRequest('Parameter article id tidak valid.');

    const steps = await StepProgress.findAll({
      where: { user_id: req.user.id, article_id: articleId, completed: true },
      attributes: ['step_index'],
      order: [['step_index', 'ASC']],
    });

    return res.status(200).json({
      success: true,
      data: { article_id: articleId, completed_steps: steps.map((s) => s.step_index) },
    });
  } catch (err) {
    return next(err);
  }
}

async function toggleStep(req, res, next) {
  try {
    const articleId = Number(req.params.articleId);
    const stepIndex = Number(req.params.stepIndex);

    if (!Number.isInteger(articleId) || articleId <= 0) throw badRequest('Parameter article id tidak valid.');
    if (!Number.isInteger(stepIndex) || stepIndex < 0) throw badRequest('Parameter step_index tidak valid.');

    const article = await Article.findOne({ where: { id: articleId, status: 'published' }, attributes: ['id'] });
    if (!article) throw notFound('Artikel tidak ditemukan.');

    const [record, created] = await StepProgress.findOrCreate({
      where: { user_id: req.user.id, article_id: articleId, step_index: stepIndex },
      defaults: { completed: true },
    });

    if (!created) {
      record.completed = !record.completed;
      await record.save();
    }

    return res.status(200).json({
      success: true,
      data: { article_id: articleId, step_index: stepIndex, completed: record.completed },
    });
  } catch (err) {
    return next(err);
  }
}

async function resetProgress(req, res, next) {
  try {
    const articleId = Number(req.params.articleId);
    if (!Number.isInteger(articleId) || articleId <= 0) throw badRequest('Parameter article id tidak valid.');

    await StepProgress.destroy({ where: { user_id: req.user.id, article_id: articleId } });

    return res.status(200).json({ success: true, data: { article_id: articleId, reset: true } });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getProgress, toggleStep, resetProgress };
