'use strict';

const express = require('express');
const {
  listArticleComments,
  createComment,
  deleteComment,
  listAdminComments,
} = require('../controllers/commentController');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');

const router = express.Router();

// Admin/Author routes
router.get('/comments', authenticate, listAdminComments);

// Admin only
router.get('/admin/comments', authenticate, authorize('admin'), listAdminComments);

// Public routes
router.get('/articles/:articleId/comments', listArticleComments);
router.post('/articles/:articleId/comments', authenticate, createComment);
router.delete('/:id', authenticate, deleteComment);

module.exports = router;
