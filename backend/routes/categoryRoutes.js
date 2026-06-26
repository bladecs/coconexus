'use strict';

const express = require('express');
const {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { authenticate } = require('../middlewares/authenticate');
const { authorize, authorizeModeratorScopes } = require('../middlewares/authorize');

const router = express.Router();

// Public
router.get('/', listCategories);

// Authenticated users
router.get('/authenticated', authenticate, listCategories);
router.post('/', authenticate, authorize('pengelola'), createCategory);
router.put('/:id', authenticate, authorize('pengelola'), updateCategory);
router.delete('/:id', authenticate, authorize('pengelola'), deleteCategory);

// Moderator tag routes
router.get('/moderation/tag', authenticate, authorizeModeratorScopes('tag'), listCategories);

module.exports = router;
