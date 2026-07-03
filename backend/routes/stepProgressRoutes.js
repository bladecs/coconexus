'use strict';

const express = require('express');
const { getProgress, toggleStep, resetProgress } = require('../controllers/stepProgressController');
const { authenticate } = require('../middlewares/authenticate');

const router = express.Router();

router.get('/:articleId', authenticate, getProgress);
router.post('/:articleId/:stepIndex', authenticate, toggleStep);
router.delete('/:articleId', authenticate, resetProgress);

module.exports = router;
