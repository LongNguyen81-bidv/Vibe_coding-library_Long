const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { createCategorySchema, updateCategorySchema, validate } = require('../validators/category.validator');

/**
 * @route   GET /api/categories
 * @desc    Get all categories
 * @access  Public
 */
router.get('/', categoryController.getAllCategories);

/**
 * @route   POST /api/categories
 * @desc    Create a new category
 * @access  Private (Librarian/Admin)
 */
router.post(
  '/',
  authenticate,
  authorize('librarian', 'admin'),
  validate(createCategorySchema),
  categoryController.createCategory
);

/**
 * @route   PUT /api/categories/:id
 * @desc    Update a category
 * @access  Private (Librarian/Admin)
 */
router.put(
  '/:id',
  authenticate,
  authorize('librarian', 'admin'),
  validate(updateCategorySchema),
  categoryController.updateCategory
);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete a category
 * @access  Private (Librarian/Admin)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('librarian', 'admin'),
  categoryController.deleteCategory
);

module.exports = router;

