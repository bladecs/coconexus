'use strict';

const express = require('express');
const { uploadArticleMediaFile, uploadMyAvatar } = require('../controllers/uploadController');
const { authenticate } = require('../middlewares/authenticate');
const { authorizeArticleAuthors } = require('../middlewares/authorize');
const { uploadArticleMedia, uploadAvatarImage } = require('../config/storage');

const router = express.Router();

router.post(
  '/articles',
  authenticate,
  authorizeArticleAuthors(),
  uploadArticleMedia.single('file'),
  uploadArticleMediaFile
);
router.post(
  '/avatars/me',
  authenticate,
  uploadAvatarImage.single('file'),
  uploadMyAvatar
);

module.exports = router;
