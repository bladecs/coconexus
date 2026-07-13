'use strict';

const express = require('express');
const {
  listPublishedArticles,
  listFeaturedMainArticles,
  getPublishedArticleDetail,
  listAdminArticles,
  getAdminArticleDetail,
  listMainArticles,
  listAvailableProductCards,
  listPublicTags,
  getRelatedArticles,
  createArticle,
  updateArticle,
  updateArticleStatus,
  deleteArticle,
  listMyArticles,
  getMyArticleDetail,
  submitMyArticle,
  deleteMyArticle,
} = require('../controllers/articleController');
const { rateArticle, getArticleRating } = require('../controllers/ratingController');
const { generateArticlePdf } = require('../controllers/pdfController');
const { authenticate, optionalAuthenticate } = require('../middlewares/authenticate');
const { authorize, authorizeModeratorScopes, authorizeContributor } = require('../middlewares/authorize');

const router = express.Router();

// Public routes
router.get('/published', listPublishedArticles);
router.get('/published/featured-main', listFeaturedMainArticles);
router.get('/tags/public', listPublicTags);
router.get('/published/:id/rating', optionalAuthenticate, getArticleRating);
router.post('/published/:id/rating', authenticate, rateArticle);
router.get('/published/:id/related', getRelatedArticles);
router.get('/published/:id/pdf', generateArticlePdf);
router.get('/published/:id', optionalAuthenticate, getPublishedArticleDetail);

// Pengelola: monitoring (read-only)
router.get('/', authenticate, authorize('pengelola'), listAdminArticles);

// Kurator Konten (moderator, sub-tipe content): authoring
router.post('/', authenticate, authorizeModeratorScopes('content'), createArticle);
router.put('/:id', authenticate, authorizeModeratorScopes('content'), updateArticle);
router.delete('/:id', authenticate, authorizeModeratorScopes('content'), deleteArticle);

// Redaktur Publikasi (moderator, sub-tipe publication): satu-satunya yang boleh ubah status
router.patch('/:id/status', authenticate, authorizeModeratorScopes('publication'), updateArticleStatus);

// Moderator routes
router.get('/moderation/content', authenticate, authorizeModeratorScopes('content'), listAdminArticles);
router.get('/moderation/publication', authenticate, authorizeModeratorScopes('publication'), listAdminArticles);

// Contributor routes — harus sebelum /:id agar tidak tertangkap oleh pengelola route
router.get('/my/articles', authenticate, authorizeContributor(), listMyArticles);
router.post('/my/articles', authenticate, authorizeContributor(), createArticle);
router.get('/my/articles/:id', authenticate, authorizeContributor(), getMyArticleDetail);
router.put('/my/articles/:id', authenticate, authorizeContributor(), updateArticle);
router.patch('/my/articles/:id/submit', authenticate, authorizeContributor(), submitMyArticle);
router.delete('/my/articles/:id', authenticate, authorizeContributor(), deleteMyArticle);

router.get('/:id', authenticate, authorize('pengelola'), getAdminArticleDetail);

module.exports = router;
