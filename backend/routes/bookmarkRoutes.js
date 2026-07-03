'use strict';

const express = require('express');
const { toggleBookmark, checkBookmark, listBookmarks } = require('../controllers/bookmarkController');
const { authenticate } = require('../middlewares/authenticate');

const router = express.Router();

router.post('/toggle/:articleId', authenticate, toggleBookmark);
router.get('/check/:articleId', authenticate, checkBookmark);
router.get('/', authenticate, listBookmarks);

module.exports = router;
