'use strict';

const express = require('express');
const {
  listArticleComments,
  createComment,
  deleteComment,
  listAdminComments,
  updateCommentStatus,
} = require('../controllers/commentController');
const { authenticate } = require('../middlewares/authenticate');
const { authorize, authorizeJobs } = require('../middlewares/authorize');

const router = express.Router();

const COMMENT_MANAGEMENT_JOBS = ['Moderator Komentar'];

// Admin/Author routes
router.get('/comments', authenticate, authorizeJobs(...COMMENT_MANAGEMENT_JOBS), listAdminComments);
router.patch('/comments/:id/status', authenticate, authorizeJobs(...COMMENT_MANAGEMENT_JOBS), updateCommentStatus);

// Admin only
router.get('/admin/comments', authenticate, authorize('admin'), listAdminComments);

// Public routes
router.get('/articles/:articleId/comments', listArticleComments);
router.post('/articles/:articleId/comments', authenticate, createComment);
router.delete('/:id', authenticate, deleteComment);

module.exports = router;
