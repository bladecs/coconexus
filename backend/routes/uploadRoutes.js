'use strict';

const express = require('express');
const { uploadArticleMediaFile, uploadMyAvatar } = require('../controllers/uploadController');
const { authenticate } = require('../middlewares/authenticate');
const { authorizeJobs } = require('../middlewares/authorize');
const { uploadArticleMedia, uploadAvatarImage } = require('../config/storage');

const router = express.Router();
const ARTICLE_UPLOAD_JOBS = ['Penulis Artikel', 'Editor Konten', 'Publisher Artikel'];

router.post(
  '/articles',
  authenticate,
  authorizeJobs(...ARTICLE_UPLOAD_JOBS),
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
