const express = require('express');
const router = express.Router();
const borrowingController = require('../controllers/borrowing.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { createBorrowingSchema, rejectBorrowingSchema, confirmReturnSchema, validate } = require('../validators/borrowing.validator');

/**
 * @route   POST /api/borrowings
 * @desc    Create a new borrowing request
 * @access  Private (Reader)
 */
router.post(
  '/',
  authenticate,
  authorize('reader'),
  validate(createBorrowingSchema),
  borrowingController.createBorrowing
);

/**
 * @route   GET /api/borrowings/pending
 * @desc    Get list of pending borrowing requests
 * @access  Private (Librarian, Admin)
 */
router.get(
  '/pending',
  authenticate,
  authorize('librarian', 'admin'),
  borrowingController.getPendingBorrowings
);

/**
 * @route   PATCH /api/borrowings/:id/confirm
 * @desc    Confirm a borrowing request
 * @access  Private (Librarian, Admin)
 */
router.patch(
  '/:id/confirm',
  authenticate,
  authorize('librarian', 'admin'),
  borrowingController.confirmBorrowing
);

/**
 * @route   PATCH /api/borrowings/:id/reject
 * @desc    Reject a borrowing request
 * @access  Private (Librarian, Admin)
 */
router.patch(
  '/:id/reject',
  authenticate,
  authorize('librarian', 'admin'),
  validate(rejectBorrowingSchema),
  borrowingController.rejectBorrowing
);

/**
 * @route   GET /api/borrowings/history
 * @desc    Get borrowing history for current user
 * @access  Private (Reader)
 */
router.get(
  '/history',
  authenticate,
  authorize('reader'),
  borrowingController.getBorrowingHistory
);

/**
 * @route   POST /api/borrowings/:id/return-request
 * @desc    Create return request
 * @access  Private (Reader)
 */
router.post(
  '/:id/return-request',
  authenticate,
  authorize('reader'),
  borrowingController.createReturnRequest
);

/**
 * @route   PATCH /api/borrowings/:id/extend
 * @desc    Extend borrowing
 * @access  Private (Reader)
 */
router.patch(
  '/:id/extend',
  authenticate,
  authorize('reader'),
  borrowingController.extendBorrowing
);

/**
 * @route   PATCH /api/borrowings/:id/cancel
 * @desc    Cancel borrowing request
 * @access  Private (Reader)
 */
router.patch(
  '/:id/cancel',
  authenticate,
  authorize('reader'),
  borrowingController.cancelBorrowing
);

/**
 * @route   GET /api/borrowings/fine-levels
 * @desc    Get all fine levels
 * @access  Private (Librarian, Admin)
 */
router.get(
  '/fine-levels',
  authenticate,
  authorize('librarian', 'admin'),
  borrowingController.getFineLevels
);

/**
 * @route   GET /api/borrowings/return-requests/pending
 * @desc    Get list of pending return requests
 * @access  Private (Librarian, Admin)
 */
router.get(
  '/return-requests/pending',
  authenticate,
  authorize('librarian', 'admin'),
  borrowingController.getPendingReturnRequests
);

/**
 * @route   PATCH /api/borrowings/return-requests/:id/confirm
 * @desc    Confirm return request
 * @access  Private (Librarian, Admin)
 */
router.patch(
  '/return-requests/:id/confirm',
  authenticate,
  authorize('librarian', 'admin'),
  validate(confirmReturnSchema),
  borrowingController.confirmReturn
);

module.exports = router;

