'use strict';

const express = require('express');
const { getModeratorOverview } = require('../controllers/moderatorController');
const { listAdminArticles, updateArticleStatus, listArticleVersions, publishArticleVersion } = require('../controllers/articleController');
const { listAdminComments, updateCommentStatus } = require('../controllers/commentController');
const {
  createDiscussionForumDraft,
  validateDiscussionForum,
  activateDiscussionForum,
  listDiscussionForums,
} = require('../controllers/discussionForumController');
const { listCategories } = require('../controllers/categoryController');
const { MODERATOR_TYPES } = require('../utils/accessControl');
const { authenticate } = require('../middlewares/authenticate');
const { authorize, authorizeModeratorScopes } = require('../middlewares/authorize');

const router = express.Router();

router.get('/overview', authenticate, authorize('moderator'), getModeratorOverview);
router.get(`/${MODERATOR_TYPES[0]}/articles`, authenticate, authorizeModeratorScopes('content'), listAdminArticles);
router.patch(`/${MODERATOR_TYPES[0]}/articles/:id/status`, authenticate, authorizeModeratorScopes('content'), updateArticleStatus);
router.get(`/${MODERATOR_TYPES[1]}/articles`, authenticate, authorizeModeratorScopes('publication'), listAdminArticles);
router.patch(`/${MODERATOR_TYPES[1]}/articles/:id/status`, authenticate, authorizeModeratorScopes('publication'), updateArticleStatus);
router.get(`/${MODERATOR_TYPES[1]}/articles/:id/versions`, authenticate, authorizeModeratorScopes('publication'), listArticleVersions);
router.post(`/${MODERATOR_TYPES[1]}/articles/:id/versions/:version/publish`, authenticate, authorizeModeratorScopes('publication'), publishArticleVersion);
router.get(`/${MODERATOR_TYPES[2]}/comments`, authenticate, authorizeModeratorScopes('forum'), listAdminComments);
router.patch(`/${MODERATOR_TYPES[2]}/comments/:id/status`, authenticate, authorizeModeratorScopes('forum'), updateCommentStatus);
router.get(`/${MODERATOR_TYPES[2]}/discussion-forums`, authenticate, authorizeModeratorScopes('forum'), listDiscussionForums);
router.post(`/${MODERATOR_TYPES[2]}/discussion-forums`, authenticate, authorizeModeratorScopes('forum'), createDiscussionForumDraft);
router.patch(`/${MODERATOR_TYPES[2]}/discussion-forums/:id/validate`, authenticate, authorizeModeratorScopes('forum'), validateDiscussionForum);
router.patch(`/${MODERATOR_TYPES[2]}/discussion-forums/:id/activate`, authenticate, authorizeModeratorScopes('forum'), activateDiscussionForum);
router.get(`/${MODERATOR_TYPES[3]}/categories`, authenticate, authorizeModeratorScopes('tag'), listCategories);

module.exports = router;
