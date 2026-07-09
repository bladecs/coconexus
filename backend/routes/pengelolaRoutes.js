'use strict';

const express = require('express');
const { getPengelolaOverview } = require('../controllers/pengelolaController');
const {
  listAdminArticles,
  getAdminArticleDetail,
  listMainArticles,
  listAvailableProductCards,
  listArticleVersions,
  publishArticleVersion,
  createArticle,
  updateArticle,
  updateArticleStatus,
  setArticleHomeFeature,
  deleteArticle,
} = require('../controllers/articleController');
const {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { listAllTags, deleteTag } = require('../controllers/tagController');
const {
  listContributorRequests,
  reviewContributorRequest,
} = require('../controllers/contributorController');
const { authenticate } = require('../middlewares/authenticate');
const { authorizePengelola } = require('../middlewares/authorizePengelola');

const router = express.Router();

router.get('/overview', authenticate, authorizePengelola(), getPengelolaOverview);
router.get('/articles', authenticate, authorizePengelola(), listAdminArticles);
router.get('/articles/main-articles', authenticate, authorizePengelola(), listMainArticles);
router.get('/articles/product-cards/available', authenticate, authorizePengelola(), listAvailableProductCards);
router.get('/articles/:id', authenticate, authorizePengelola(), getAdminArticleDetail);
router.get('/articles/:id/versions', authenticate, authorizePengelola(), listArticleVersions);
router.post('/articles', authenticate, authorizePengelola(), createArticle);
router.put('/articles/:id', authenticate, authorizePengelola(), updateArticle);
router.patch('/articles/:id/status', authenticate, authorizePengelola(), updateArticleStatus);
router.patch('/articles/:id/feature', authenticate, authorizePengelola(), setArticleHomeFeature);
router.post('/articles/:id/versions/:version/publish', authenticate, authorizePengelola(), publishArticleVersion);
router.delete('/articles/:id', authenticate, authorizePengelola(), deleteArticle);

router.get('/categories', authenticate, authorizePengelola(), listCategories);
router.post('/categories', authenticate, authorizePengelola(), createCategory);
router.put('/categories/:id', authenticate, authorizePengelola(), updateCategory);
router.delete('/categories/:id', authenticate, authorizePengelola(), deleteCategory);

router.get('/tags', authenticate, authorizePengelola(), listAllTags);
router.delete('/tags/:id', authenticate, authorizePengelola(), deleteTag);

router.get('/contributor-requests', authenticate, authorizePengelola(), listContributorRequests);
router.patch('/contributor-requests/:userId', authenticate, authorizePengelola(), reviewContributorRequest);

module.exports = router;
