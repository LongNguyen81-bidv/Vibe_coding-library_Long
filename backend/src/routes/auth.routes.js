const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { registerSchema, validate } = require('../validators/auth.validator');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * @route   GET /api/auth/check-email/:email
 * @desc    Check if email already exists
 * @access  Public
 */
router.get('/check-email/:email', authController.checkEmail);

module.exports = router;

