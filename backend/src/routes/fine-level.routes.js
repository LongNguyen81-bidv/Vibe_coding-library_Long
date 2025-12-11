const express = require('express');
const router = express.Router();
const fineLevelController = require('../controllers/fine-level.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { createFineLevelSchema, updateFineLevelSchema, validate } = require('../validators/fine-level.validator');

/**
 * @route   GET /api/fine-levels
 * @desc    Get all fine levels
 * @access  Public
 */
router.get('/', fineLevelController.getAllFineLevels);

/**
 * @route   POST /api/fine-levels
 * @desc    Create a new fine level
 * @access  Private (Admin only)
 */
router.post(
  '/',
  authenticate,
  authorize('admin'),
  validate(createFineLevelSchema),
  fineLevelController.createFineLevel
);

/**
 * @route   PUT /api/fine-levels/:id
 * @desc    Update a fine level
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(updateFineLevelSchema),
  fineLevelController.updateFineLevel
);

/**
 * @route   DELETE /api/fine-levels/:id
 * @desc    Delete a fine level
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  fineLevelController.deleteFineLevel
);

module.exports = router;

