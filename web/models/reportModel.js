const { staffDb } = require('../db');

// queries for the staff dashboard (aggregate + nested queries)

async function getSummary() {
  const [rows] = await staffDb.execute(
    `SELECT COUNT(*) AS num_orders,
            IFNULL(SUM(total_amount), 0) AS total_sales,
            IFNULL(ROUND(AVG(total_amount), 2), 0) AS avg_order
     FROM orders
     WHERE status <> 'Cancelled'`
  );
  return rows[0];
}

async function getSalesByCategory() {
  const [rows] = await staffDb.execute(
    `SELECT c.category_name,
            SUM(oi.quantity) AS copies_sold,
            SUM(oi.quantity * oi.unit_price) AS revenue
     FROM order_item oi
     JOIN book b     ON oi.book_id = b.book_id
     JOIN category c ON b.category_id = c.category_id
     JOIN orders o   ON oi.order_id = o.order_id
     WHERE o.status <> 'Cancelled'
     GROUP BY c.category_name
     ORDER BY revenue DESC`
  );
  return rows;
}

async function getSalesByMonth() {
  const [rows] = await staffDb.execute(
    `SELECT DATE_FORMAT(order_date, '%Y-%m') AS sales_month,
            COUNT(*) AS num_orders,
            SUM(total_amount) AS sales
     FROM orders
     WHERE status <> 'Cancelled'
     GROUP BY sales_month
     ORDER BY sales_month`
  );
  return rows;
}

async function getUnpaidOrders() {
  const [rows] = await staffDb.execute(
    `SELECT o.order_id, o.order_date, o.status, o.total_amount
     FROM orders o
     WHERE o.status <> 'Cancelled'
       AND NOT EXISTS (SELECT 1 FROM payment p WHERE p.order_id = o.order_id)`
  );
  return rows;
}

async function getLowStock() {
  const [rows] = await staffDb.execute(
    `SELECT book_id, title, stock_qty, availability
     FROM v_book_catalog
     WHERE stock_qty < 10
     ORDER BY stock_qty`
  );
  return rows;
}

async function getTopCustomers() {
  const [rows] = await staffDb.execute(
    `SELECT customer_id, name, fn_customer_spent(customer_id) AS spent
     FROM customer
     ORDER BY spent DESC`
  );
  return rows;
}

async function getBooksNeverOrdered() {
  const [rows] = await staffDb.execute(
    `SELECT book_id, title, stock_qty
     FROM book
     WHERE book_id NOT IN (SELECT DISTINCT book_id FROM order_item)`
  );
  return rows;
}

module.exports = {
  getSummary, getSalesByCategory, getSalesByMonth, getUnpaidOrders,
  getLowStock, getTopCustomers, getBooksNeverOrdered
};
