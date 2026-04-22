'use strict';

const express = require('express');
const { getDashboardStats } = require('../controllers/adminController');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');

const router = express.Router();

router.get('/stats', authenticate, authorize('admin'), getDashboardStats);

module.exports = router;
