'use strict';

const express = require('express');
const { getPengelolaOverview } = require('../controllers/pengelolaController');
const {
  listAdminArticles,
  getAdminArticleDetail,
  listMainArticles,
  listAvailableProductCards,
  listArticleVersions,
} = require('../controllers/articleController');
const { listCategories } = require('../controllers/categoryController');
const { listAllTags } = require('../controllers/tagController');
const {
  listContributorRequests,
  reviewContributorRequest,
} = require('../controllers/contributorController');
const { authenticate } = require('../middlewares/authenticate');
const { authorizePengelola } = require('../middlewares/authorizePengelola');

const router = express.Router();

// Pengelola sekarang murni peran monitoring/oversight untuk lingkup konten
// (analog dengan Admin, tapi terbatas pada konten) — tidak ada endpoint create/update/delete
// di sini. Pembuatan & penyuntingan artikel adalah wewenang Kurator Konten, publikasi adalah
// wewenang Redaktur Publikasi, dan kategori/tag adalah wewenang Penata Taksonomi
// (lihat moderatorRoutes.js).
router.get('/overview', authenticate, authorizePengelola(), getPengelolaOverview);
router.get('/articles', authenticate, authorizePengelola(), listAdminArticles);
router.get('/articles/main-articles', authenticate, authorizePengelola(), listMainArticles);
router.get('/articles/product-cards/available', authenticate, authorizePengelola(), listAvailableProductCards);
router.get('/articles/:id', authenticate, authorizePengelola(), getAdminArticleDetail);
router.get('/articles/:id/versions', authenticate, authorizePengelola(), listArticleVersions);

router.get('/categories', authenticate, authorizePengelola(), listCategories);
router.get('/tags', authenticate, authorizePengelola(), listAllTags);

router.get('/contributor-requests', authenticate, authorizePengelola(), listContributorRequests);
router.patch('/contributor-requests/:userId', authenticate, authorizePengelola(), reviewContributorRequest);

module.exports = router;
