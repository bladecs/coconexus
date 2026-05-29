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
const { authenticate, optionalAuthenticate } = require('../middlewares/authenticate');
const { authorize, authorizeJobs } = require('../middlewares/authorize');

const router = express.Router();

const ARTICLE_MANAGEMENT_JOBS = ['Penulis Artikel', 'Editor Konten'];
const ARTICLE_REVIEW_JOBS = ['Editor Konten', 'Validator Artikel'];
const ARTICLE_PUBLISH_JOBS = ['Publisher Artikel'];

// Public routes
router.get('/published', listPublishedArticles);
router.get('/published/:id', optionalAuthenticate, getPublishedArticleDetail);

// Author/Pengelola routes
router.get('/', authenticate, authorizeJobs(...ARTICLE_MANAGEMENT_JOBS, ...ARTICLE_REVIEW_JOBS, ...ARTICLE_PUBLISH_JOBS), listAdminArticles);
router.post('/', authenticate, authorizeJobs(...ARTICLE_MANAGEMENT_JOBS), createArticle);
router.put('/:id', authenticate, authorizeJobs(...ARTICLE_MANAGEMENT_JOBS), updateArticle);
router.delete('/:id', authenticate, authorizeJobs(...ARTICLE_MANAGEMENT_JOBS), deleteArticle);
router.patch('/:id/status', authenticate, authorizeJobs(...ARTICLE_REVIEW_JOBS, ...ARTICLE_PUBLISH_JOBS), updateArticleStatus);
router.get('/:id', authenticate, authorizeJobs(...ARTICLE_MANAGEMENT_JOBS, ...ARTICLE_REVIEW_JOBS, ...ARTICLE_PUBLISH_JOBS), getAdminArticleDetail);

// Admin routes
router.get('/admin', authenticate, authorize('admin'), listAdminArticles);
router.get('/admin/main-articles', authenticate, authorize('admin'), listMainArticles);
router.get('/admin/product-cards/available', authenticate, authorize('admin'), listAvailableProductCards);
router.get('/admin/:id', authenticate, authorize('admin'), getAdminArticleDetail);
router.post('/admin', authenticate, authorize('admin'), createArticle);
router.put('/admin/:id', authenticate, authorize('admin'), updateArticle);
router.patch('/admin/:id/status', authenticate, authorize('admin'), updateArticleStatus);
router.delete('/admin/:id', authenticate, authorize('admin'), deleteArticle);

module.exports = router;
