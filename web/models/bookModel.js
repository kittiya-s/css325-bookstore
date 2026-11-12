const { customerDb, staffDb } = require('../db');

// ----- customer side (reads the view, not the book table) -----

async function getCategories() {
  const [rows] = await customerDb.execute(
    'SELECT category_id, category_name FROM category ORDER BY category_name'
  );
  return rows;
}

async function searchBooks(categoryId, keyword) {
  let sql = 'SELECT * FROM v_book_catalog WHERE 1 = 1';
  const params = [];

  if (categoryId) {
    sql += ' AND category_id = ?';
    params.push(categoryId);
  }
  if (keyword) {
    sql += ' AND (title LIKE ? OR author LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  sql += ' ORDER BY title';

  const [rows] = await customerDb.execute(sql, params);
  return rows;
}

async function getBookById(bookId) {
  const [rows] = await customerDb.execute(
    'SELECT * FROM v_book_catalog WHERE book_id = ?', [bookId]
  );
  return rows[0] || null;
}

// ----- staff side -----

async function getAllBooks() {
  const [rows] = await staffDb.execute(
    `SELECT b.book_id, b.title, b.author, c.category_name, b.price, b.stock_qty
     FROM book b
     JOIN category c ON b.category_id = c.category_id
     ORDER BY b.book_id`
  );
  return rows;
}

async function getCategoriesForStaff() {
  const [rows] = await staffDb.execute(
    'SELECT category_id, category_name FROM category ORDER BY category_name'
  );
  return rows;
}

async function addBook(categoryId, title, author, price, stockQty) {
  await staffDb.execute(
    'INSERT INTO book (category_id, title, author, price, stock_qty) VALUES (?, ?, ?, ?, ?)',
    [categoryId, title, author, price, stockQty]
  );
}

async function restockBook(bookId, amount) {
  await staffDb.execute(
    'UPDATE book SET stock_qty = stock_qty + ? WHERE book_id = ?', [amount, bookId]
  );
}

module.exports = {
  getCategories, searchBooks, getBookById,
  getAllBooks, getCategoriesForStaff, addBook, restockBook
};
