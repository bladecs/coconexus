'use strict';

const express = require('express');
const {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { authenticate } = require('../middlewares/authenticate');
const { authorizeModeratorScopes } = require('../middlewares/authorize');

const router = express.Router();

// Public
router.get('/', listCategories);

// Authenticated users
router.get('/authenticated', authenticate, listCategories);
router.post('/', authenticate, authorizeModeratorScopes('tag'), createCategory);
router.put('/:id', authenticate, authorizeModeratorScopes('tag'), updateCategory);
router.delete('/:id', authenticate, authorizeModeratorScopes('tag'), deleteCategory);

// Moderator tag routes
router.get('/moderation/tag', authenticate, authorizeModeratorScopes('tag'), listCategories);

module.exports = router;
