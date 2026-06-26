'use strict';

const express = require('express');
const { listPublicForums, listForumComments, createForumComment } = require('../controllers/discussionForumController');
const { authenticate } = require('../middlewares/authenticate');

const router = express.Router();

// Public — list all active forums
router.get('/', listPublicForums);

// Public — list comments in an active forum
router.get('/:forumId/comments', listForumComments);

// Authenticated — post a comment to an active forum
router.post('/:forumId/comments', authenticate, createForumComment);

module.exports = router;
