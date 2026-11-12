const { customerDb } = require('../db');

async function findByEmail(email) {
  const [rows] = await customerDb.execute(
    'SELECT customer_id, name, password_hash FROM customer WHERE email = ?', [email]
  );
  return rows[0] || null;
}

async function createCustomer(name, email, passwordHash) {
  const [result] = await customerDb.execute(
    'INSERT INTO customer (name, email, password_hash) VALUES (?, ?, ?)',
    [name, email, passwordHash]
  );
  return result.insertId;
}

async function getAddresses(customerId) {
  const [rows] = await customerDb.execute(
    `SELECT address_id, recipient_name, address_detail, postal_code
     FROM address WHERE customer_id = ?`,
    [customerId]
  );
  return rows;
}

async function addAddress(customerId, recipientName, addressDetail, postalCode) {
  await customerDb.execute(
    `INSERT INTO address (customer_id, recipient_name, address_detail, postal_code)
     VALUES (?, ?, ?, ?)`,
    [customerId, recipientName, addressDetail, postalCode]
  );
}

module.exports = { findByEmail, createCustomer, getAddresses, addAddress };
