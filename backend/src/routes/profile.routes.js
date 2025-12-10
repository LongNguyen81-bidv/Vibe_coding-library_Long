const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { updateProfileSchema, changePasswordSchema, validate } = require('../validators/profile.validator');

/**
 * @route   GET /api/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/', authenticate, profileController.getProfile);

/**
 * @route   PUT /api/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/', authenticate, validate(updateProfileSchema), profileController.updateProfile);

/**
 * @route   PUT /api/profile/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password', authenticate, validate(changePasswordSchema), profileController.changePassword);

module.exports = router;

