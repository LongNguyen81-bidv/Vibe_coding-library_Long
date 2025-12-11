const express = require('express');
const router = express.Router();
const fineController = require('../controllers/fine.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { payFineSchema, rejectPaymentSchema, validate } = require('../validators/fine.validator');

/**
 * @route   GET /api/fines/my
 * @desc    Get list of fines for current user (reader)
 * @access  Private (Reader)
 */
router.get(
  '/my',
  authenticate,
  authorize('reader'),
  fineController.getMyFines
);

/**
 * @route   GET /api/fines
 * @desc    Get all fines (for librarian/admin)
 * @access  Private (Librarian, Admin)
 */
router.get(
  '/',
  authenticate,
  authorize('librarian', 'admin'),
  fineController.getAllFines
);

/**
 * @route   GET /api/fines/:id
 * @desc    Get fine detail by ID
 * @access  Private (Reader, Librarian, Admin)
 */
router.get(
  '/:id',
  authenticate,
  fineController.getFineDetail
);

/**
 * @route   PATCH /api/fines/:id/pay
 * @desc    Pay fine (submit payment proof)
 * @access  Private (Reader)
 */
router.patch(
  '/:id/pay',
  authenticate,
  authorize('reader'),
  validate(payFineSchema),
  fineController.payFine
);

/**
 * @route   PATCH /api/fines/:id/confirm
 * @desc    Confirm fine payment (for librarian/admin)
 * @access  Private (Librarian, Admin)
 */
router.patch(
  '/:id/confirm',
  authenticate,
  authorize('librarian', 'admin'),
  fineController.confirmPayment
);

/**
 * @route   PATCH /api/fines/:id/reject
 * @desc    Reject fine payment (for librarian/admin)
 * @access  Private (Librarian, Admin)
 */
router.patch(
  '/:id/reject',
  authenticate,
  authorize('librarian', 'admin'),
  validate(rejectPaymentSchema),
  fineController.rejectPayment
);

module.exports = router;

