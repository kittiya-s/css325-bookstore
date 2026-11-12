-- 02_sample_data.sql
-- Run as bookstore_owner (after 01_schema.sql, before 03)
-- Login passwords for the web: somchai123, malee123, john123, ploy123, natta123

USE toocute_bookstore;

INSERT INTO category (category_name) VALUES
('Fiction'), ('Mystery'), ('Science Fiction'), ('Romance'), ('Self-Help');

INSERT INTO book (category_id, title, author, price, image_url, stock_qty) VALUES
(1, 'The Bookshop on Rainy Street', 'Mali Srisuk',  320.00, NULL, 25),
(1, 'The Innkeeper''s Daughter',    'Anna Clarke',  280.00, NULL, 18),
(1, 'Edge of the World',            'Tom Hale',     350.00, NULL, 12),
(2, 'Detective Brown',              'James Porter', 295.00, NULL, 20),
(2, 'The Lost Temple',              'Sara Kim',     310.00, NULL,  8),
(2, 'Cleopatra Lost Artist',        'Nadia Farouk', 390.00, NULL,  5),
(3, 'Last City on Mars',            'Leo Grant',    420.00, NULL, 15),
(3, 'The Silent Garden',            'Yuki Tanaka',  260.00, NULL,  0),
(4, 'Love Letters from a Stranger', 'Emma Rose',    240.00, NULL, 30),
(4, 'My Cat is Now My Boss',        'Pim Chaiyo',   199.00, NULL, 40),
(5, 'Small Habits, Big Life',       'Daniel Moore', 350.00, NULL, 22),
(5, 'Focus Like a Monk',            'Krit Wong',    299.00, NULL, 10);

INSERT INTO customer (name, email, password_hash) VALUES
('Somchai Jaidee', 'somchai@example.com',
 '13a6609e34b9857dc851b420a35da4e9:d71127b719accbca9426741d4d421de8996e5c386ea11084a6175c863dfa05ebce804279ff952ce0264c25ef0ad765282f0721df7672196c8827ded1f81ffdcd'),
('Malee Rakdee', 'malee@example.com',
 'c342bf9a21ca3a7d16c74899c8f78232:a22825177815231ab283916d5b043cc9051105e64bcfc85fff0b586355604a46fba60de92442ee8a7667ffb80f588b2b6f288d9b7e6bc1cc35532ece5ead2fcd'),
('John Smith', 'john@example.com',
 '80525474eb0646f11f79e16042fc5793:6d915b7d2e1e82ccddd2be6ae64a696d407c051e6619e00ce857e2c18277c51e507c8ddd3f206563e78b7e27dd98d3fe2965c64cf86f0e9b73aa794aa0cd1021'),
('Ploy Sukjai', 'ploy@example.com',
 '1c48d0185a139ca6ffe529e92d37a405:123a6cd8fe20aa680ea8f87c16fb3e2271b0171c2e700ad020e762df0c516b46838459bcc241fb34cdfcd44fb8898a6e7659c922877fce943ac0e3a5b7b8ae96'),
('Nattapong Kaewdee', 'natta@example.com',
 'f0dce5502a6be6677dd3018c003ae5bb:ffa44fc0c7941457de1b6c7a02ae6c6743ead9e589533e141e74729fa213bb6bc5e922b38024d59ee04a47d28412bdd68b060c60f0b8722ac05eb0f36a09ac92');

INSERT INTO address (customer_id, recipient_name, address_detail, postal_code) VALUES
(1, 'Somchai Jaidee', '99 Rangsit Rd, Khlong Luang, Pathum Thani', '12120'),
(1, 'Somchai (Office)', '12 Silom Rd, Bang Rak, Bangkok',         '10500'),
(2, 'Malee Rakdee',   '45 Tiwanon Rd, Mueang, Nonthaburi',         '11000'),
(3, 'John Smith',     '8 Sukhumvit Soi 11, Watthana, Bangkok',     '10110'),
(4, 'Ploy Sukjai',    '200 Nimman Rd, Mueang, Chiang Mai',         '50200'),
(4, 'Ploy''s Mom',    '7 Mittraphap Rd, Mueang, Khon Kaen',        '40000'),
(5, 'Nattapong K.',   '31 Bangkadi, Mueang, Pathum Thani',         '12000');

INSERT INTO orders (customer_id, address_id, order_date, status) VALUES
(1, 1, '2026-09-01 10:15:00', 'Delivered'),
(1, 2, '2026-09-20 14:30:00', 'Shipped'),
(2, 3, '2026-10-02 09:00:00', 'Delivered'),
(3, 4, '2026-10-10 18:45:00', 'Paid'),
(4, 5, '2026-10-15 11:20:00', 'Delivered'),
(4, 6, '2026-11-01 08:05:00', 'Pending'),
(2, 3, '2026-11-05 20:10:00', 'Cancelled');
-- customer 5 (Nattapong) has no order yet

INSERT INTO order_item (order_id, book_id, quantity, unit_price) VALUES
(1, 1, 1, 320.00), (1, 4, 2, 295.00),
(2, 7, 1, 420.00),
(3, 9, 2, 240.00), (3, 10, 1, 199.00), (3, 1, 1, 320.00),
(4, 11, 1, 350.00), (4, 12, 1, 299.00),
(5, 4, 1, 295.00), (5, 5, 1, 310.00), (5, 6, 1, 390.00),
(6, 10, 3, 199.00),
(7, 3, 1, 350.00);

-- total_amount of each order = sum of its items
UPDATE orders o
SET total_amount = (SELECT SUM(oi.quantity * oi.unit_price)
                    FROM order_item oi
                    WHERE oi.order_id = o.order_id)
WHERE o.order_id > 0;   -- Workbench safe update mode needs a key column in WHERE

INSERT INTO payment (order_id, payment_method, amount) VALUES
(1, 'Credit Card',   910.00),
(2, 'PromptPay',     420.00),
(3, 'Bank Transfer', 999.00),
(4, 'Credit Card',   649.00),
(5, 'PromptPay',     995.00);
-- order 6 (Pending) and 7 (Cancelled) have no payment

SELECT 'category' AS tbl, COUNT(*) AS num_rows FROM category
UNION ALL SELECT 'book', COUNT(*) FROM book
UNION ALL SELECT 'customer', COUNT(*) FROM customer
UNION ALL SELECT 'address', COUNT(*) FROM address
UNION ALL SELECT 'orders', COUNT(*) FROM orders
UNION ALL SELECT 'order_item', COUNT(*) FROM order_item
UNION ALL SELECT 'payment', COUNT(*) FROM payment;
