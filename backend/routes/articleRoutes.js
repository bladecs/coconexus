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
const { authorize, authorizeModeratorScopes } = require('../middlewares/authorize');

const router = express.Router();

// Public routes
router.get('/published', listPublishedArticles);
router.get('/published/:id', optionalAuthenticate, getPublishedArticleDetail);

// Author/Pengelola routes
router.get('/', authenticate, authorize('pengelola'), listAdminArticles);
router.post('/', authenticate, authorize('pengelola'), createArticle);
router.put('/:id', authenticate, authorize('pengelola'), updateArticle);
router.delete('/:id', authenticate, authorize('pengelola'), deleteArticle);
router.patch('/:id/status', authenticate, authorize('pengelola'), updateArticleStatus);

// Moderator routes
router.get('/moderation/content', authenticate, authorizeModeratorScopes('content'), listAdminArticles);
router.get('/moderation/publication', authenticate, authorizeModeratorScopes('publication'), listAdminArticles);

router.get('/:id', authenticate, authorize('pengelola'), getAdminArticleDetail);

module.exports = router;
