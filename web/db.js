// Two connection pools, one for each MySQL account.
// customerDb -> app_customer (role_customer)
// staffDb    -> app_staff    (role_staff)
// so even if the shop pages have a bug, they cannot touch what the customer role is not allowed to.
require('dotenv').config();
const mysql = require('mysql2/promise');

const common = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'toocute_bookstore',
  waitForConnections: true,
  connectionLimit: 5,
  dateStrings: true
};

const customerDb = mysql.createPool({
  ...common,
  user: process.env.DB_CUSTOMER_USER,
  password: process.env.DB_CUSTOMER_PASS
});

const staffDb = mysql.createPool({
  ...common,
  user: process.env.DB_STAFF_USER,
  password: process.env.DB_STAFF_PASS
});

module.exports = { customerDb, staffDb };
