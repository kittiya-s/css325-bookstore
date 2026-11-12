const express = require('express');
const staffController = require('../controllers/staffController');
const { requireStaff } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

// every staff route needs a staff login
router.use(requireStaff);

router.get('/dashboard', asyncHandler(staffController.getDashboard));
router.get('/orders', asyncHandler(staffController.getOrders));
router.put('/orders/:id/status', asyncHandler(staffController.updateOrderStatus));
router.get('/books', asyncHandler(staffController.getBooks));
router.post('/books', asyncHandler(staffController.addBook));
router.post('/books/:id/restock', asyncHandler(staffController.restockBook));

module.exports = router;
