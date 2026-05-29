'use strict';

const express = require('express');
const {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { authenticate } = require('../middlewares/authenticate');
const { authorize, authorizeJobs } = require('../middlewares/authorize');

const router = express.Router();

const CATEGORY_MANAGEMENT_JOBS = ['Pengelola Tag/Kategori'];

// Public
router.get('/', listCategories);

// Authenticated users (pengelola, admin)
router.get('/authenticated', authenticate, listCategories);
router.post('/', authenticate, authorizeJobs(...CATEGORY_MANAGEMENT_JOBS), createCategory);
router.put('/:id', authenticate, authorizeJobs(...CATEGORY_MANAGEMENT_JOBS), updateCategory);
router.delete('/:id', authenticate, authorizeJobs(...CATEGORY_MANAGEMENT_JOBS), deleteCategory);

// Admin only (deprecated, kept for backward compatibility)
router.get('/admin', authenticate, authorize('admin'), listCategories);
router.post('/admin', authenticate, authorize('admin'), createCategory);
router.put('/admin/:id', authenticate, authorize('admin'), updateCategory);
router.delete('/admin/:id', authenticate, authorize('admin'), deleteCategory);

module.exports = router;
