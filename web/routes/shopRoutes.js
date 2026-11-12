const express = require('express');
const shopController = require('../controllers/shopController');
const { requireCustomer } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.get('/categories', asyncHandler(shopController.getCategories));
router.get('/books', asyncHandler(shopController.getBooks));
router.get('/books/:id', asyncHandler(shopController.getBook));

router.get('/addresses', requireCustomer, asyncHandler(shopController.getAddresses));
router.post('/addresses', requireCustomer, asyncHandler(shopController.addAddress));

router.get('/orders', requireCustomer, asyncHandler(shopController.getMyOrders));
router.post('/orders', requireCustomer, asyncHandler(shopController.placeOrder));

module.exports = router;
