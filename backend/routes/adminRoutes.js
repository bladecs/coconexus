'use strict';

const express = require('express');
const {
  getDashboardStats,
  getAuditLogs,
  getSystemHealth,
  getReports,
} = require('../controllers/adminController');
const { listUsers, adminUpdateUser } = require('../controllers/userController');
const { getSettings, updateSettings, testConnection } = require('../controllers/chatbotController');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');

const router = express.Router();

// Dashboard
router.get('/stats', authenticate, authorize('admin'), getDashboardStats);

// Users Management
router.get('/users', authenticate, authorize('admin'), listUsers);
router.put('/users/:id/role', authenticate, authorize('admin'), adminUpdateUser);
router.put('/users/:id/profile', authenticate, authorize('admin'), adminUpdateUser);

// Audit Logs
router.get('/audit-logs', authenticate, authorize('admin'), getAuditLogs);

// System Health
router.get('/system-health', authenticate, authorize('admin'), getSystemHealth);
router.post('/system/cache/clear', authenticate, authorize('admin'), getSystemHealth);
router.post('/system/maintenance', authenticate, authorize('admin'), getSystemHealth);

// Reports
router.get('/reports', authenticate, authorize('admin'), getReports);
router.get('/reports/export', authenticate, authorize('admin'), getReports);

// Chatbot Settings
router.get('/chatbot/settings', authenticate, authorize('admin'), getSettings);
router.put('/chatbot/settings', authenticate, authorize('admin'), updateSettings);
router.post('/chatbot/test', authenticate, authorize('admin'), testConnection);

module.exports = router;
