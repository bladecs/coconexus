'use strict';

const express = require('express');
const { getPublicConfig, chat } = require('../controllers/chatbotController');

const router = express.Router();

router.get('/config', getPublicConfig);
router.post('/chat', chat);

module.exports = router;
