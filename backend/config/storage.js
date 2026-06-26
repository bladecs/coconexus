'use strict';

const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { badRequest } = require('../utils/httpErrors');

const uploadRoot = path.resolve(__dirname, '..', 'uploads');
const articleUploadDir = path.join(uploadRoot, 'articles');
const avatarUploadDir = path.join(uploadRoot, 'avatars');
const commentUploadDir = path.join(uploadRoot, 'comment-attachments');

fs.mkdirSync(articleUploadDir, { recursive: true });
fs.mkdirSync(avatarUploadDir, { recursive: true });
fs.mkdirSync(commentUploadDir, { recursive: true });

function createDiskStorage(destinationDir) {
  return multer.diskStorage({
    destination(req, file, cb) {
      cb(null, destinationDir);
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname || '').toLowerCase();
      const safeBaseName = path
        .basename(file.originalname || 'file', ext)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60) || 'file';

      cb(null, `${Date.now()}-${safeBaseName}${ext}`);
    },
  });
}

const articleStorage = createDiskStorage(articleUploadDir);
const avatarStorage = createDiskStorage(avatarUploadDir);
const commentAttachmentStorage = createDiskStorage(commentUploadDir);

function mediaFileFilter(req, file, cb) {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'application/pdf',
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    cb(badRequest('Tipe file tidak didukung. Gunakan JPG, PNG, WEBP, GIF, MP4, atau PDF.'));
    return;
  }

  cb(null, true);
}

function imageFileFilter(req, file, cb) {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    cb(badRequest('Avatar hanya mendukung JPG, PNG, WEBP, atau GIF.'));
    return;
  }

  cb(null, true);
}

function commentAttachmentFileFilter(req, file, cb) {
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    cb(badRequest('Lampiran komentar hanya mendukung PDF, DOC, DOCX, XLS, XLSX, atau TXT.'));
    return;
  }

  cb(null, true);
}

const uploadArticleMedia = multer({
  storage: articleStorage,
  fileFilter: mediaFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

const uploadAvatarImage = multer({
  storage: avatarStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const uploadCommentAttachment = multer({
  storage: commentAttachmentStorage,
  fileFilter: commentAttachmentFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = {
  uploadRoot,
  uploadArticleMedia,
  uploadAvatarImage,
  uploadCommentAttachment,
};
