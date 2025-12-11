const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

/**
 * @route   GET /api/dashboard
 * @desc    Get dashboard statistics
 * @access  Private (Admin, Librarian)
 */
router.get('/', authenticate, authorize('admin', 'librarian'), dashboardController.getDashboardStats);

module.exports = router;

