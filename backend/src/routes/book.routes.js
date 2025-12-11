const express = require('express');
const router = express.Router();
const bookController = require('../controllers/book.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { createBookSchema, updateBookSchema, validate } = require('../validators/book.validator');

/**
 * @route   GET /api/books
 * @desc    Get all books with pagination, search, filter, and sort
 * @access  Public
 */
router.get('/', bookController.getAllBooks);

/**
 * @route   GET /api/books/:id
 * @desc    Get book by ID with borrow history (if user is librarian/admin)
 * @access  Public (borrow history only for staff)
 */
router.get('/:id', bookController.getBookById);

/**
 * @route   POST /api/books
 * @desc    Create a new book
 * @access  Private (Librarian/Admin)
 */
router.post(
  '/',
  authenticate,
  authorize('librarian', 'admin'),
  validate(createBookSchema),
  bookController.createBook
);

/**
 * @route   PUT /api/books/:id
 * @desc    Update a book by ID
 * @access  Private (Librarian/Admin)
 */
router.put(
  '/:id',
  authenticate,
  authorize('librarian', 'admin'),
  validate(updateBookSchema),
  bookController.updateBook
);

/**
 * @route   DELETE /api/books/:id
 * @desc    Delete a book by ID
 * @access  Private (Librarian/Admin)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('librarian', 'admin'),
  bookController.deleteBook
);

module.exports = router;

