'use strict';

const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const articleRoutes = require('./articleRoutes');
const commentRoutes = require('./commentRoutes');
const uploadRoutes = require('./uploadRoutes');
const categoryRoutes = require('./categoryRoutes');
const adminRoutes = require('./adminRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/articles', articleRoutes);
router.use('/categories', categoryRoutes);
router.use('/admin', adminRoutes);
router.use('/', commentRoutes);
router.use('/uploads', uploadRoutes);

module.exports = router;
