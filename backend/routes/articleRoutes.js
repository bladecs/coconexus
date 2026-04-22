'use strict';

const express = require('express');
const {
  listPublishedArticles,
  getPublishedArticleDetail,
  listAdminArticles,
  getAdminArticleDetail,
  listMainArticles,
  listAvailableProductCards,
  createArticle,
  updateArticle,
  updateArticleStatus,
  deleteArticle,
} = require('../controllers/articleController');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');

const router = express.Router();

router.get('/published', listPublishedArticles);
router.get('/published/:id', getPublishedArticleDetail);

router.get('/admin', authenticate, authorize('admin'), listAdminArticles);
router.get('/admin/main-articles', authenticate, authorize('admin'), listMainArticles);
router.get('/admin/product-cards/available', authenticate, authorize('admin'), listAvailableProductCards);
router.get('/admin/:id', authenticate, authorize('admin'), getAdminArticleDetail);
router.post('/admin', authenticate, authorize('admin'), createArticle);
router.put('/admin/:id', authenticate, authorize('admin'), updateArticle);
router.patch('/admin/:id/status', authenticate, authorize('admin'), updateArticleStatus);
router.delete('/admin/:id', authenticate, authorize('admin'), deleteArticle);

module.exports = router;
