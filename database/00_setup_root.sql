-- 00_setup_root.sql
-- Run this file ONE TIME only, logged in as root.
-- root is used only to create the database and the accounts.
-- After this step we log in as bookstore_owner and never use root again.

CREATE DATABASE IF NOT EXISTS toocute_bookstore
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- owner account: builds tables, views, triggers, procedures in toocute_bookstore only
CREATE USER IF NOT EXISTS 'bookstore_owner'@'localhost' IDENTIFIED BY 'Owner#Too2026';
GRANT ALL PRIVILEGES ON toocute_bookstore.* TO 'bookstore_owner'@'localhost' WITH GRANT OPTION;

-- roles (privileges are given later in 04_access_control.sql)
CREATE ROLE IF NOT EXISTS 'role_customer', 'role_staff';

-- accounts that the web app uses to connect
CREATE USER IF NOT EXISTS 'app_customer'@'localhost' IDENTIFIED BY 'Cust#Too2026';
CREATE USER IF NOT EXISTS 'app_staff'@'localhost'    IDENTIFIED BY 'Staff#Too2026';

GRANT 'role_customer' TO 'app_customer'@'localhost';
GRANT 'role_staff'    TO 'app_staff'@'localhost';
SET DEFAULT ROLE ALL TO 'app_customer'@'localhost', 'app_staff'@'localhost';

-- MySQL 8 has binary logging on by default, so a normal user (not SUPER)
-- gets error 1419 when creating triggers/functions. This lets bookstore_owner
-- create them. Our triggers and function do not use random values, so it is safe here.
SET PERSIST log_bin_trust_function_creators = 1;

-- check
SELECT user, host FROM mysql.user
WHERE user IN ('bookstore_owner', 'app_customer', 'app_staff', 'role_customer', 'role_staff');
