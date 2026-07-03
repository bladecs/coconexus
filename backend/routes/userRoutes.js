'use strict';

const express = require('express');
const {
  getMe,
  updateMyProfile,
  listUsers,
  getUserById,
  adminUpdateUser,
  adminSoftDeleteUser,
  createUser,
} = require('../controllers/userController');
const {
  applyContributor,
  cancelContributorRequest,
} = require('../controllers/contributorController');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');

const router = express.Router();

router.get('/me', authenticate, getMe);
router.put('/me/profile', authenticate, updateMyProfile);
router.post('/me/contributor-request', authenticate, authorize('user'), applyContributor);
router.delete('/me/contributor-request', authenticate, authorize('user'), cancelContributorRequest);

router.post('/admin', authenticate, authorize('admin'), createUser);
router.get('/admin', authenticate, authorize('admin'), listUsers);
router.get('/admin/:id', authenticate, authorize('admin'), getUserById);
router.put('/admin/:id', authenticate, authorize('admin'), adminUpdateUser);
router.delete('/admin/:id', authenticate, authorize('admin'), adminSoftDeleteUser);

module.exports = router;
