const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

/**
 * @route   GET /api/reports/books
 * @desc    Get books report
 * @access  Private (Admin, Librarian)
 */
router.get('/books', authenticate, authorize('admin', 'librarian'), reportController.getBooksReport);

/**
 * @route   GET /api/reports/borrowings
 * @desc    Get borrowings report
 * @access  Private (Admin, Librarian)
 */
router.get('/borrowings', authenticate, authorize('admin', 'librarian'), reportController.getBorrowingsReport);

/**
 * @route   GET /api/reports/fines
 * @desc    Get fines report
 * @access  Private (Admin, Librarian)
 */
router.get('/fines', authenticate, authorize('admin', 'librarian'), reportController.getFinesReport);

/**
 * @route   GET /api/reports/lost-damaged
 * @desc    Get lost/damaged books report
 * @access  Private (Admin, Librarian)
 */
router.get('/lost-damaged', authenticate, authorize('admin', 'librarian'), reportController.getLostDamagedReport);

/**
 * @route   POST /api/reports/export
 * @desc    Export report to CSV
 * @access  Private (Admin, Librarian)
 */
router.post('/export', authenticate, authorize('admin', 'librarian'), reportController.exportCSV);

module.exports = router;

