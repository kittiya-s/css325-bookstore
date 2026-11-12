-- 01_schema.sql
-- Run as bookstore_owner
-- Creates the 7 tables from our revised Project 1 design.

USE toocute_bookstore;

-- drop in reverse order because of foreign keys (so the file can be re-run)
DROP TABLE IF EXISTS payment;
DROP TABLE IF EXISTS order_item;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS address;
DROP TABLE IF EXISTS customer;
DROP TABLE IF EXISTS book;
DROP TABLE IF EXISTS category;

CREATE TABLE category (
    category_id   INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE book (
    book_id     INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    title       VARCHAR(200) NOT NULL,
    author      VARCHAR(150) NOT NULL,
    price       DECIMAL(10,2) NOT NULL,
    image_url   VARCHAR(255),
    stock_qty   INT NOT NULL DEFAULT 0,
    CONSTRAINT chk_book_price CHECK (price >= 0),
    CONSTRAINT chk_book_stock CHECK (stock_qty >= 0),
    CONSTRAINT fk_book_category FOREIGN KEY (category_id)
        REFERENCES category(category_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE customer (
    customer_id   INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(150) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL   -- salt:hash (scrypt), never the real password
);

CREATE TABLE address (
    address_id     INT AUTO_INCREMENT PRIMARY KEY,
    customer_id    INT NOT NULL,
    recipient_name VARCHAR(150) NOT NULL,
    address_detail VARCHAR(255) NOT NULL,
    postal_code    CHAR(5) NOT NULL,
    CONSTRAINT chk_postal CHECK (postal_code REGEXP '^[0-9]{5}$'),
    CONSTRAINT fk_address_customer FOREIGN KEY (customer_id)
        REFERENCES customer(customer_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- ORDER is a reserved word in SQL, so the table is called orders
CREATE TABLE orders (
    order_id     INT AUTO_INCREMENT PRIMARY KEY,
    customer_id  INT NOT NULL,
    address_id   INT NOT NULL,
    order_date   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status       ENUM('Pending','Paid','Shipped','Delivered','Cancelled')
                 NOT NULL DEFAULT 'Pending',
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    CONSTRAINT chk_order_total CHECK (total_amount >= 0),
    CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id)
        REFERENCES customer(customer_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_orders_address FOREIGN KEY (address_id)
        REFERENCES address(address_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE order_item (
    order_id   INT NOT NULL,
    book_id    INT NOT NULL,
    quantity   INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,   -- price at the time of ordering
    PRIMARY KEY (order_id, book_id),
    CONSTRAINT chk_item_qty CHECK (quantity > 0),
    CONSTRAINT chk_item_price CHECK (unit_price >= 0),
    CONSTRAINT fk_item_order FOREIGN KEY (order_id)
        REFERENCES orders(order_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_item_book FOREIGN KEY (book_id)
        REFERENCES book(book_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE payment (
    payment_id     INT AUTO_INCREMENT PRIMARY KEY,
    order_id       INT NOT NULL UNIQUE,   -- UNIQUE makes it 1:1 with orders
    payment_method ENUM('Credit Card','Bank Transfer','PromptPay','Cash on Delivery') NOT NULL,
    amount         DECIMAL(10,2) NOT NULL,
    CONSTRAINT chk_pay_amount CHECK (amount >= 0),
    CONSTRAINT fk_payment_order FOREIGN KEY (order_id)
        REFERENCES orders(order_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

SHOW TABLES;
