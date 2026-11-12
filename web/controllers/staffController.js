const reportModel = require('../models/reportModel');
const orderModel = require('../models/orderModel');
const bookModel = require('../models/bookModel');

const STATUSES = ['Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled'];

async function getDashboard(req, res) {
  res.json({
    summary: await reportModel.getSummary(),
    byCategory: await reportModel.getSalesByCategory(),
    byMonth: await reportModel.getSalesByMonth(),
    unpaid: await reportModel.getUnpaidOrders(),
    lowStock: await reportModel.getLowStock(),
    topCustomers: await reportModel.getTopCustomers(),
    neverOrdered: await reportModel.getBooksNeverOrdered()
  });
}

async function getOrders(req, res) {
  res.json({ orders: await orderModel.getAllOrders(), statuses: STATUSES });
}

async function updateOrderStatus(req, res) {
  const { status } = req.body;
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }
  await orderModel.updateStatus(req.params.id, status);
  res.json({ message: `Order #${req.params.id} is now ${status}.` });
}

async function getBooks(req, res) {
  res.json({
    books: await bookModel.getAllBooks(),
    categories: await bookModel.getCategoriesForStaff()
  });
}

async function addBook(req, res) {
  const { category_id, title, author, price, stock_qty } = req.body;
  if (!title || !author || price === '' || price === undefined) {
    return res.status(400).json({ error: 'Please fill in title, author and price.' });
  }

  try {
    await bookModel.addBook(category_id, title.trim(), author.trim(), price, stock_qty || 0);
    res.json({ message: `Added "${title.trim()}".` });
  } catch (err) {
    // e.g. CHECK constraint fails when the price is negative
    if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
      return res.status(400).json({ error: 'Price and stock cannot be negative.' });
    }
    throw err;
  }
}

async function restockBook(req, res) {
  const amount = parseInt(req.body.amount, 10);
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Amount must be more than 0.' });
  }
  await bookModel.restockBook(req.params.id, amount);
  res.json({ message: `Added ${amount} copies to stock.` });
}

module.exports = { getDashboard, getOrders, updateOrderStatus, getBooks, addBook, restockBook };
