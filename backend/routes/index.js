'use strict';

const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const articleRoutes = require('./articleRoutes');
const commentRoutes = require('./commentRoutes');
const uploadRoutes = require('./uploadRoutes');
const categoryRoutes = require('./categoryRoutes');
const adminRoutes = require('./adminRoutes');
const pengelolaRoutes = require('./pengelolaRoutes');
const moderatorRoutes = require('./moderatorRoutes');
const glossaryRoutes = require('./glossaryRoutes');
const forumRoutes = require('./forumRoutes');
const chatbotRoutes = require('./chatbotRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/articles', articleRoutes);
router.use('/categories', categoryRoutes);
router.use('/admin', adminRoutes);
router.use('/pengelola', pengelolaRoutes);
router.use('/moderator', moderatorRoutes);
router.use('/', commentRoutes);
router.use('/uploads', uploadRoutes);
router.use('/glossary', glossaryRoutes);
router.use('/forums', forumRoutes);
router.use('/chatbot', chatbotRoutes);

module.exports = router;
