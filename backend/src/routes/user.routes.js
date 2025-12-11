const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { rejectUserSchema, assignRoleSchema, validate } = require('../validators/user.validator');

/**
 * @route   GET /api/users
 * @desc    Get list of users with filters
 * @access  Private (Admin only)
 */
router.get('/', authenticate, authorize('admin'), userController.getUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin only)
 */
router.get('/:id', authenticate, authorize('admin'), userController.getUserById);

/**
 * @route   PATCH /api/users/:id/activate
 * @desc    Activate user account
 * @access  Private (Admin only)
 */
router.patch('/:id/activate', authenticate, authorize('admin'), userController.activateUser);

/**
 * @route   PATCH /api/users/:id/disable
 * @desc    Disable user account
 * @access  Private (Admin only)
 */
router.patch('/:id/disable', authenticate, authorize('admin'), userController.disableUser);

/**
 * @route   PATCH /api/users/:id/approve
 * @desc    Approve pending user account
 * @access  Private (Admin only)
 */
router.patch('/:id/approve', authenticate, authorize('admin'), userController.approveUser);

/**
 * @route   PATCH /api/users/:id/reject
 * @desc    Reject pending user account
 * @access  Private (Admin only)
 */
router.patch('/:id/reject', authenticate, authorize('admin'), validate(rejectUserSchema), userController.rejectUser);

/**
 * @route   PATCH /api/users/:id/assign-role
 * @desc    Assign role to user
 * @access  Private (Admin only)
 */
router.patch('/:id/assign-role', authenticate, authorize('admin'), validate(assignRoleSchema), userController.assignRole);

module.exports = router;

