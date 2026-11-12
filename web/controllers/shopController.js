const bookModel = require('../models/bookModel');
const customerModel = require('../models/customerModel');
const orderModel = require('../models/orderModel');

const PAYMENT_METHODS = ['Credit Card', 'Bank Transfer', 'PromptPay', 'Cash on Delivery'];

async function getCategories(req, res) {
  res.json(await bookModel.getCategories());
}

async function getBooks(req, res) {
  const categoryId = req.query.category || '';
  const keyword = (req.query.q || '').trim();
  res.json(await bookModel.searchBooks(categoryId, keyword));
}

async function getBook(req, res) {
  const book = await bookModel.getBookById(req.params.id);
  if (!book) return res.status(404).json({ error: 'Book not found.' });
  res.json(book);
}

async function getAddresses(req, res) {
  res.json(await customerModel.getAddresses(req.session.customer.id));
}

async function addAddress(req, res) {
  const recipient = (req.body.recipient_name || '').trim();
  const detail = (req.body.address_detail || '').trim();
  const postal = (req.body.postal_code || '').trim();

  if (!recipient || !detail || !/^[0-9]{5}$/.test(postal)) {
    return res.status(400).json({ error: 'Please fill in every field. Postal code must be 5 digits.' });
  }

  // customer_id comes from the session, not from the form
  await customerModel.addAddress(req.session.customer.id, recipient, detail, postal);
  res.json({ message: 'Address added.' });
}

async function placeOrder(req, res) {
  const { book_id, address_id, quantity, method } = req.body;

  if (!PAYMENT_METHODS.includes(method)) {
    return res.status(400).json({ error: 'Please choose a payment method.' });
  }

  try {
    const orderId = await orderModel.placeOrder(
      req.session.customer.id, address_id, book_id, quantity, method
    );
    res.json({ message: `Order #${orderId} placed. Thank you!`, order_id: orderId });
  } catch (err) {
    // errors from SIGNAL in our trigger/procedure have sqlState 45000
    if (err.sqlState === '45000') {
      return res.status(400).json({ error: err.sqlMessage });
    }
    throw err;
  }
}

async function getMyOrders(req, res) {
  res.json(await orderModel.getMyOrders(req.session.customer.id));
}

module.exports = {
  getCategories, getBooks, getBook, getAddresses, addAddress, placeOrder, getMyOrders
};
