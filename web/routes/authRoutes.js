const express = require('express');
const authController = require('../controllers/authController');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.get('/me', authController.me);
router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));
router.post('/staff/login', authController.staffLogin);
router.post('/logout', authController.logout);

module.exports = router;
