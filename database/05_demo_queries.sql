-- 05_demo_queries.sql
-- Run as bookstore_owner, ONE QUERY AT A TIME (Ctrl+Enter in Workbench).
-- Some queries are supposed to fail to show the trigger / rollback / permission.

USE toocute_bookstore;

-- ============================================================
-- A. RETRIEVAL: JOIN
-- ============================================================

-- A1. all orders with customer, address and payment (view = 4-table join)
SELECT order_id, customer_name, recipient_name, order_date, status,
       total_amount, payment_method
FROM v_order_summary
ORDER BY order_date;

-- A2. items in every order with book title and category (4-table join)
SELECT o.order_id, b.title, c.category_name, oi.quantity, oi.unit_price,
       oi.quantity * oi.unit_price AS line_total
FROM order_item oi
JOIN orders   o ON oi.order_id   = o.order_id
JOIN book     b ON oi.book_id    = b.book_id
JOIN category c ON b.category_id = c.category_id
ORDER BY o.order_id;

-- A3. LEFT JOIN: every customer and number of orders (Nattapong shows 0)
SELECT c.customer_id, c.name, COUNT(o.order_id) AS num_orders
FROM customer c
LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.name
ORDER BY num_orders DESC;

-- ============================================================
-- B. AGGREGATE
-- ============================================================

-- B1. sales by category, only categories that sold at least 2 copies
SELECT c.category_name,
       SUM(oi.quantity) AS copies_sold,
       SUM(oi.quantity * oi.unit_price) AS revenue
FROM order_item oi
JOIN book b     ON oi.book_id = b.book_id
JOIN category c ON b.category_id = c.category_id
JOIN orders o   ON oi.order_id = o.order_id
WHERE o.status <> 'Cancelled'
GROUP BY c.category_name
HAVING SUM(oi.quantity) >= 2
ORDER BY revenue DESC;

-- B2. monthly sales
SELECT DATE_FORMAT(order_date, '%Y-%m') AS sales_month,
       COUNT(*) AS num_orders,
       SUM(total_amount) AS sales,
       ROUND(AVG(total_amount), 2) AS avg_per_order
FROM orders
WHERE status <> 'Cancelled'
GROUP BY sales_month
ORDER BY sales_month;

-- B3. number of orders in each status
SELECT status, COUNT(*) AS num_orders
FROM orders
GROUP BY status;

-- ============================================================
-- C. NESTED QUERIES
-- ============================================================

-- C1. books more expensive than the average price
SELECT title, author, price
FROM book
WHERE price > (SELECT AVG(price) FROM book)
ORDER BY price DESC;

-- C2. books that nobody has ordered yet
SELECT book_id, title, stock_qty
FROM book
WHERE book_id NOT IN (SELECT DISTINCT book_id FROM order_item);

-- C3. orders that are not paid yet (correlated, NOT EXISTS)
SELECT o.order_id, o.status, o.total_amount
FROM orders o
WHERE NOT EXISTS (SELECT 1 FROM payment p WHERE p.order_id = o.order_id);

-- C4. the biggest order of each customer (correlated subquery)
SELECT c.name, o.order_id, o.total_amount
FROM orders o
JOIN customer c ON o.customer_id = c.customer_id
WHERE o.total_amount = (SELECT MAX(o2.total_amount)
                        FROM orders o2
                        WHERE o2.customer_id = o.customer_id);

-- C5. customers who bought something in the Mystery category
SELECT name, email
FROM customer
WHERE customer_id IN (
    SELECT o.customer_id
    FROM orders o
    JOIN order_item oi ON o.order_id = oi.order_id
    JOIN book b ON oi.book_id = b.book_id
    WHERE b.category_id = (SELECT category_id FROM category
                           WHERE category_name = 'Mystery'));

-- ============================================================
-- D. FUNCTION + VIEW
-- ============================================================

-- D1. total spent by each customer
SELECT customer_id, name, fn_customer_spent(customer_id) AS total_spent
FROM customer
ORDER BY total_spent DESC;

-- D2. books that are low or out of stock
SELECT title, stock_qty, availability
FROM v_book_catalog
WHERE availability <> 'In stock';

-- ============================================================
-- E. MODIFICATION (INSERT / UPDATE / DELETE) + SCHEMA CHANGE
-- ============================================================

-- E1. add a new book
INSERT INTO book (category_id, title, author, price, stock_qty)
VALUES (3, 'Robots of Bangkadi', 'Too Cute Team', 330.00, 10);

-- E2. restock a book that is out of stock
UPDATE book SET stock_qty = stock_qty + 20 WHERE book_id = 8;

-- E3. delete the cancelled order; its order_item rows go too (ON DELETE CASCADE)
DELETE FROM orders WHERE order_id = 7 AND status = 'Cancelled';
SELECT * FROM order_item WHERE order_id = 7;     -- 0 rows

-- E4. try to delete a category that still has books -> error (ON DELETE RESTRICT)
DELETE FROM category WHERE category_id = 1;

-- E5. CHECK constraint: negative price is rejected
UPDATE book SET price = -50 WHERE book_id = 1;

-- E6. ALTER TABLE: add phone number to customer + an index for searching titles
ALTER TABLE customer ADD COLUMN phone VARCHAR(15) NULL AFTER email;
UPDATE customer SET phone = '0812345678' WHERE customer_id = 1;
CREATE INDEX idx_book_title ON book(title);
DESCRIBE customer;

-- ============================================================
-- F. TRIGGERS + TRANSACTION
-- ============================================================

-- F1. normal order: book 2 stock 18 -> 16, order becomes Paid
SELECT book_id, title, stock_qty FROM book WHERE book_id = 2;
CALL sp_place_order(5, 7, 2, 2, 'PromptPay');
SELECT book_id, title, stock_qty FROM book WHERE book_id = 2;
SELECT * FROM v_order_summary ORDER BY order_id DESC LIMIT 1;

-- F2. not enough stock (book 6 has 5 left) -> trigger error, rollback
SELECT COUNT(*) AS orders_before FROM orders;
CALL sp_place_order(1, 1, 6, 99, 'Credit Card');
SELECT COUNT(*) AS orders_after FROM orders;     -- same number, nothing left behind

-- F3. wrong address (address 3 is Malee's, not Somchai's) -> rollback
CALL sp_place_order(1, 3, 1, 1, 'Credit Card');

-- F4. cancel order 6 -> trigger puts 3 copies of book 10 back
SELECT stock_qty FROM book WHERE book_id = 10;
UPDATE orders SET status = 'Cancelled' WHERE order_id = 6;
SELECT stock_qty FROM book WHERE book_id = 10;

-- F5. manual transaction with ROLLBACK
START TRANSACTION;
UPDATE book SET price = price * 0.5 WHERE book_id > 0;   -- mistake: 50% off everything
SELECT title, price FROM book LIMIT 3;
ROLLBACK;
SELECT title, price FROM book LIMIT 3;           -- prices are back

-- F6. manual transaction with COMMIT (move stock between 2 books in one go)
START TRANSACTION;
UPDATE book SET stock_qty = stock_qty - 2 WHERE book_id = 9;
UPDATE book SET stock_qty = stock_qty + 2 WHERE book_id = 3;
COMMIT;

-- ============================================================
-- G. ACCESS CONTROL
-- ============================================================
-- G1. As bookstore_owner this fails with ERROR 1142.
--     That is good: the owner only controls toocute_bookstore, not MySQL's own user list.
SHOW GRANTS FOR 'app_staff'@'localhost';

-- Open a NEW connection in Workbench as app_staff (password Staff#Too2026) and run:
--   SHOW GRANTS FOR CURRENT_USER() USING 'role_staff';  -- see its own privileges
--   USE toocute_bookstore;
--   SELECT * FROM v_order_summary;                -- OK
--   SELECT customer_id, name, email FROM customer; -- OK
--   SELECT password_hash FROM customer;           -- ERROR 1143 (column denied)
--   DELETE FROM book WHERE book_id = 1;           -- ERROR 1142 (DELETE denied)
--   UPDATE orders SET total_amount = 0 WHERE order_id = 1;  -- ERROR 1143 (only status allowed)
--
-- Open a NEW connection as app_customer (password Cust#Too2026) and run:
--   SHOW GRANTS FOR CURRENT_USER() USING 'role_customer';
--   USE toocute_bookstore;
--   SELECT * FROM v_book_catalog;                 -- OK
--   SELECT * FROM book;                           -- ERROR 1142 (must use the view)
--   INSERT INTO orders (customer_id, address_id) VALUES (1, 1);  -- ERROR 1142
--   CALL sp_place_order(3, 4, 9, 1, 'PromptPay'); -- OK, the only way to order
