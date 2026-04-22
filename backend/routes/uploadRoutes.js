'use strict';

const express = require('express');
const { uploadArticleMediaFile, uploadMyAvatar } = require('../controllers/uploadController');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');
const { uploadArticleMedia, uploadAvatarImage } = require('../config/storage');

const router = express.Router();

router.post(
  '/articles',
  authenticate,
  authorize('admin'),
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
