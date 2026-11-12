-- 03_views_triggers_procedures.sql
-- Run as bookstore_owner (after 02_sample_data.sql)
-- Triggers are created AFTER the sample data so the sample stock numbers stay as they are.

USE toocute_bookstore;

DROP VIEW IF EXISTS v_book_catalog;
DROP VIEW IF EXISTS v_order_summary;
DROP VIEW IF EXISTS v_order_detail;
DROP TRIGGER IF EXISTS trg_check_stock;
DROP TRIGGER IF EXISTS trg_after_item_insert;
DROP TRIGGER IF EXISTS trg_after_payment;
DROP TRIGGER IF EXISTS trg_order_cancelled;
DROP PROCEDURE IF EXISTS sp_place_order;
DROP FUNCTION IF EXISTS fn_customer_spent;

-- ============================================================
-- VIEWS
-- ============================================================

-- book list that customers can see (no need to give them the book table)
CREATE VIEW v_book_catalog AS
SELECT b.book_id, b.title, b.author, b.category_id, c.category_name,
       b.price, b.image_url, b.stock_qty,
       CASE
         WHEN b.stock_qty = 0  THEN 'Out of stock'
         WHEN b.stock_qty < 10 THEN 'Low stock'
         ELSE 'In stock'
       END AS availability
FROM book b
JOIN category c ON b.category_id = c.category_id;

-- one row per order: who ordered, where to send, paid or not
CREATE VIEW v_order_summary AS
SELECT o.order_id, o.customer_id, c.name AS customer_name,
       a.recipient_name, a.address_detail, a.postal_code,
       o.order_date, o.status, o.total_amount,
       IFNULL(p.payment_method, 'Not paid') AS payment_method
FROM orders o
JOIN customer c ON o.customer_id = c.customer_id
JOIN address  a ON o.address_id  = a.address_id
LEFT JOIN payment p ON o.order_id = p.order_id;

-- items inside each order
CREATE VIEW v_order_detail AS
SELECT oi.order_id, o.customer_id, oi.book_id, b.title,
       oi.quantity, oi.unit_price,
       oi.quantity * oi.unit_price AS line_total
FROM order_item oi
JOIN orders o ON oi.order_id = o.order_id
JOIN book   b ON oi.book_id  = b.book_id;

DELIMITER $$

-- ============================================================
-- TRIGGERS
-- ============================================================

-- 1) stop the order item if stock is not enough
CREATE TRIGGER trg_check_stock
BEFORE INSERT ON order_item
FOR EACH ROW
BEGIN
    DECLARE v_stock INT;

    SELECT stock_qty INTO v_stock
    FROM book WHERE book_id = NEW.book_id;

    IF v_stock IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Book not found';
    ELSEIF v_stock < NEW.quantity THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Not enough stock for this book';
    END IF;
END$$

-- 2) after an item is added: cut the stock and add to the order total
CREATE TRIGGER trg_after_item_insert
AFTER INSERT ON order_item
FOR EACH ROW
BEGIN
    UPDATE book
    SET stock_qty = stock_qty - NEW.quantity
    WHERE book_id = NEW.book_id;

    UPDATE orders
    SET total_amount = total_amount + (NEW.quantity * NEW.unit_price)
    WHERE order_id = NEW.order_id;
END$$

-- 3) when payment is saved, a Pending order becomes Paid
CREATE TRIGGER trg_after_payment
AFTER INSERT ON payment
FOR EACH ROW
BEGIN
    UPDATE orders
    SET status = 'Paid'
    WHERE order_id = NEW.order_id AND status = 'Pending';
END$$

-- 4) when staff cancels an order, put the books back into stock
CREATE TRIGGER trg_order_cancelled
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
    IF NEW.status = 'Cancelled' AND OLD.status <> 'Cancelled' THEN
        UPDATE book b
        JOIN order_item oi ON oi.book_id = b.book_id
        SET b.stock_qty = b.stock_qty + oi.quantity
        WHERE oi.order_id = NEW.order_id AND b.book_id > 0;
    END IF;
END$$

-- ============================================================
-- STORED PROCEDURE (transaction)
-- place an order for 1 book: create order + item + payment together.
-- if any step fails, everything is rolled back.
-- ============================================================
CREATE PROCEDURE sp_place_order(
    IN p_customer_id INT,
    IN p_address_id  INT,
    IN p_book_id     INT,
    IN p_quantity    INT,
    IN p_method      VARCHAR(30)
)
BEGIN
    DECLARE v_order_id INT;
    DECLARE v_price    DECIMAL(10,2);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;   -- send the same error message back to the caller
    END;

    IF p_quantity IS NULL OR p_quantity <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Quantity must be more than 0';
    END IF;

    START TRANSACTION;

    -- the address must belong to this customer
    IF NOT EXISTS (SELECT 1 FROM address
                   WHERE address_id = p_address_id
                     AND customer_id = p_customer_id) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'This address does not belong to the customer';
    END IF;

    -- FOR UPDATE locks the book row so 2 people cannot buy the last copy at the same time
    SELECT price INTO v_price
    FROM book WHERE book_id = p_book_id
    FOR UPDATE;

    INSERT INTO orders (customer_id, address_id)
    VALUES (p_customer_id, p_address_id);
    SET v_order_id = LAST_INSERT_ID();

    -- trigger 1 checks stock, trigger 2 cuts stock and updates total
    INSERT INTO order_item (order_id, book_id, quantity, unit_price)
    VALUES (v_order_id, p_book_id, p_quantity, v_price);

    -- trigger 3 changes status to Paid
    INSERT INTO payment (order_id, payment_method, amount)
    VALUES (v_order_id, p_method, v_price * p_quantity);

    COMMIT;

    SELECT v_order_id AS new_order_id;
END$$

-- ============================================================
-- FUNCTION
-- total money a customer has paid (cancelled orders not counted)
-- ============================================================
CREATE FUNCTION fn_customer_spent(p_customer_id INT)
RETURNS DECIMAL(10,2)
READS SQL DATA
BEGIN
    DECLARE v_total DECIMAL(10,2);

    SELECT IFNULL(SUM(p.amount), 0) INTO v_total
    FROM payment p
    JOIN orders o ON p.order_id = o.order_id
    WHERE o.customer_id = p_customer_id
      AND o.status <> 'Cancelled';

    RETURN v_total;
END$$

DELIMITER ;

SHOW FULL TABLES WHERE Table_type = 'VIEW';
SHOW TRIGGERS;
SHOW PROCEDURE STATUS WHERE Db = 'toocute_bookstore';
SHOW FUNCTION STATUS  WHERE Db = 'toocute_bookstore';
