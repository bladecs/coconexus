'use strict';

const express = require('express');
const {
  listArticleComments,
  createComment,
  deleteComment,
  listAdminComments,
  updateCommentStatus,
} = require('../controllers/commentController');
const {
  getActiveDiscussionForumByArticle,
  listForumComments,
  createForumComment,
} = require('../controllers/discussionForumController');
const { authenticate } = require('../middlewares/authenticate');
const { authorize, authorizeModeratorScopes } = require('../middlewares/authorize');
const { uploadCommentAttachment } = require('../config/storage');

const router = express.Router();

router.get('/comments', authenticate, authorizeModeratorScopes('forum'), listAdminComments);
router.patch('/comments/:id/status', authenticate, authorizeModeratorScopes('forum'), updateCommentStatus);

// Admin only
router.get('/admin/comments', authenticate, authorize('admin'), listAdminComments);

// Public routes
router.get('/articles/:articleId/comments', listArticleComments);
router.post('/articles/:articleId/comments', authenticate, uploadCommentAttachment.single('attachment'), createComment);
router.get('/articles/:articleId/discussion-forum', authenticate, getActiveDiscussionForumByArticle);
router.get('/discussion-forums/:forumId/comments', authenticate, listForumComments);
router.post('/discussion-forums/:forumId/comments', authenticate, uploadCommentAttachment.single('attachment'), createForumComment);
router.delete('/comments/:id', authenticate, deleteComment);

module.exports = router;
