'use strict';

const express = require('express');
const { recordRead, listHistory, getReadIds } = require('../controllers/readingHistoryController');
const { authenticate } = require('../middlewares/authenticate');

const router = express.Router();

router.post('/:articleId', authenticate, recordRead);
router.get('/ids', authenticate, getReadIds);
router.get('/', authenticate, listHistory);

module.exports = router;
