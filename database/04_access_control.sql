-- 04_access_control.sql
-- Run as bookstore_owner (after 03)
-- Least privilege: each app account gets only what its pages need.
-- The web app never connects as root or as bookstore_owner.

USE toocute_bookstore;

-- -----------------------------------------------------------
-- role_customer  (used by the shop pages)
-- -----------------------------------------------------------
-- browse books: only through the view, not the book table
GRANT SELECT ON toocute_bookstore.v_book_catalog TO 'role_customer';
GRANT SELECT ON toocute_bookstore.category       TO 'role_customer';

-- register + login: only these columns
GRANT SELECT (customer_id, name, email, password_hash) ON toocute_bookstore.customer TO 'role_customer';
GRANT INSERT (name, email, password_hash)               ON toocute_bookstore.customer TO 'role_customer';

-- manage own addresses
GRANT SELECT, INSERT ON toocute_bookstore.address TO 'role_customer';

-- see own orders (the app filters by customer_id)
GRANT SELECT ON toocute_bookstore.v_order_summary TO 'role_customer';
GRANT SELECT ON toocute_bookstore.v_order_detail  TO 'role_customer';

-- place an order only through the procedure.
-- the customer has NO INSERT on orders/order_item/payment, so they cannot
-- insert a fake order or change a price directly.
GRANT EXECUTE ON PROCEDURE toocute_bookstore.sp_place_order TO 'role_customer';

-- -----------------------------------------------------------
-- role_staff  (used by the staff/admin pages)
-- -----------------------------------------------------------
GRANT SELECT, INSERT, UPDATE ON toocute_bookstore.book     TO 'role_staff';
GRANT SELECT, INSERT         ON toocute_bookstore.category TO 'role_staff';

GRANT SELECT          ON toocute_bookstore.orders     TO 'role_staff';
GRANT UPDATE (status) ON toocute_bookstore.orders     TO 'role_staff';  -- can change status only, not the total
GRANT SELECT          ON toocute_bookstore.order_item TO 'role_staff';
GRANT SELECT          ON toocute_bookstore.payment    TO 'role_staff';

-- staff can see customers but NOT their password hash
GRANT SELECT (customer_id, name, email) ON toocute_bookstore.customer TO 'role_staff';

GRANT SELECT ON toocute_bookstore.v_order_summary TO 'role_staff';
GRANT SELECT ON toocute_bookstore.v_order_detail  TO 'role_staff';
GRANT SELECT ON toocute_bookstore.v_book_catalog  TO 'role_staff';
GRANT EXECUTE ON FUNCTION toocute_bookstore.fn_customer_spent TO 'role_staff';

-- no one except the owner can DELETE or DROP anything

-- To check: bookstore_owner cannot run SHOW GRANTS for other accounts
-- (that needs SELECT on the mysql system database, which the owner does not have).
-- Check from each app account instead, see section G in 05_demo_queries.sql.
