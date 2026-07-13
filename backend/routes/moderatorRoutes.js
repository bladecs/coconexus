'use strict';

const express = require('express');
const { getModeratorOverview } = require('../controllers/moderatorController');
const {
  listAdminArticles,
  getAdminArticleDetail,
  listMainArticles,
  listAvailableProductCards,
  createArticle,
  updateArticle,
  deleteArticle,
  updateArticleStatus,
  setArticleHomeFeature,
  listArticleVersions,
  publishArticleVersion,
} = require('../controllers/articleController');
const { listAdminComments, updateCommentStatus } = require('../controllers/commentController');
const {
  createDiscussionForumDraft,
  validateDiscussionForum,
  activateDiscussionForum,
  listDiscussionForums,
} = require('../controllers/discussionForumController');
const {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { listAllTags, deleteTag } = require('../controllers/tagController');
const { MODERATOR_TYPES } = require('../utils/accessControl');
const { authenticate } = require('../middlewares/authenticate');
const { authorize, authorizeModeratorScopes } = require('../middlewares/authorize');

const router = express.Router();

router.get('/overview', authenticate, authorize('moderator'), getModeratorOverview);

// Kurator Konten (content): authoring penuh — create/edit/delete artikel
router.get(`/${MODERATOR_TYPES[0]}/articles`, authenticate, authorizeModeratorScopes('content'), listAdminArticles);
router.get(`/${MODERATOR_TYPES[0]}/articles/main-articles`, authenticate, authorizeModeratorScopes('content'), listMainArticles);
router.get(`/${MODERATOR_TYPES[0]}/articles/product-cards/available`, authenticate, authorizeModeratorScopes('content'), listAvailableProductCards);
router.get(`/${MODERATOR_TYPES[0]}/articles/:id`, authenticate, authorizeModeratorScopes('content'), getAdminArticleDetail);
router.post(`/${MODERATOR_TYPES[0]}/articles`, authenticate, authorizeModeratorScopes('content'), createArticle);
router.put(`/${MODERATOR_TYPES[0]}/articles/:id`, authenticate, authorizeModeratorScopes('content'), updateArticle);
router.delete(`/${MODERATOR_TYPES[0]}/articles/:id`, authenticate, authorizeModeratorScopes('content'), deleteArticle);

// Redaktur Publikasi (publication): satu-satunya gerbang menuju status published
router.get(`/${MODERATOR_TYPES[1]}/articles`, authenticate, authorizeModeratorScopes('publication'), listAdminArticles);
router.patch(`/${MODERATOR_TYPES[1]}/articles/:id/status`, authenticate, authorizeModeratorScopes('publication'), updateArticleStatus);
router.patch(`/${MODERATOR_TYPES[1]}/articles/:id/feature`, authenticate, authorizeModeratorScopes('publication'), setArticleHomeFeature);
router.get(`/${MODERATOR_TYPES[1]}/articles/:id/versions`, authenticate, authorizeModeratorScopes('publication'), listArticleVersions);
router.post(`/${MODERATOR_TYPES[1]}/articles/:id/versions/:version/publish`, authenticate, authorizeModeratorScopes('publication'), publishArticleVersion);

// Fasilitator Diskusi (forum)
router.get(`/${MODERATOR_TYPES[2]}/comments`, authenticate, authorizeModeratorScopes('forum'), listAdminComments);
router.patch(`/${MODERATOR_TYPES[2]}/comments/:id/status`, authenticate, authorizeModeratorScopes('forum'), updateCommentStatus);
router.get(`/${MODERATOR_TYPES[2]}/discussion-forums`, authenticate, authorizeModeratorScopes('forum'), listDiscussionForums);
router.post(`/${MODERATOR_TYPES[2]}/discussion-forums`, authenticate, authorizeModeratorScopes('forum'), createDiscussionForumDraft);
router.patch(`/${MODERATOR_TYPES[2]}/discussion-forums/:id/validate`, authenticate, authorizeModeratorScopes('forum'), validateDiscussionForum);
router.patch(`/${MODERATOR_TYPES[2]}/discussion-forums/:id/activate`, authenticate, authorizeModeratorScopes('forum'), activateDiscussionForum);

// Penata Taksonomi (tag): CRUD penuh kategori & tag
router.get(`/${MODERATOR_TYPES[3]}/categories`, authenticate, authorizeModeratorScopes('tag'), listCategories);
router.post(`/${MODERATOR_TYPES[3]}/categories`, authenticate, authorizeModeratorScopes('tag'), createCategory);
router.put(`/${MODERATOR_TYPES[3]}/categories/:id`, authenticate, authorizeModeratorScopes('tag'), updateCategory);
router.delete(`/${MODERATOR_TYPES[3]}/categories/:id`, authenticate, authorizeModeratorScopes('tag'), deleteCategory);
router.get(`/${MODERATOR_TYPES[3]}/tags`, authenticate, authorizeModeratorScopes('tag'), listAllTags);
router.delete(`/${MODERATOR_TYPES[3]}/tags/:id`, authenticate, authorizeModeratorScopes('tag'), deleteTag);

module.exports = router;
