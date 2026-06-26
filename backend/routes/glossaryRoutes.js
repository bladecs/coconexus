'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');
const {
  listGlossaryTerms,
  getGlossaryTerm,
  createGlossaryTerm,
  updateGlossaryTerm,
  deleteGlossaryTerm,
} = require('../controllers/glossaryController');

// Public — siapa saja bisa baca glosarium
router.get('/', listGlossaryTerms);
router.get('/:id', getGlossaryTerm);

// Pengelola / Admin — manage istilah
router.post('/', authenticate, authorize('admin', 'pengelola'), createGlossaryTerm);
router.put('/:id', authenticate, authorize('admin', 'pengelola'), updateGlossaryTerm);
router.delete('/:id', authenticate, authorize('admin', 'pengelola'), deleteGlossaryTerm);

module.exports = router;
