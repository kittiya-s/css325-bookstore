const { customerDb, staffDb } = require('../db');

// everything happens inside sp_place_order (one transaction)
async function placeOrder(customerId, addressId, bookId, quantity, method) {
  const [result] = await customerDb.query(
    'CALL sp_place_order(?, ?, ?, ?, ?)',
    [customerId, addressId, bookId, quantity, method]
  );
  return result[0][0].new_order_id;
}

async function getMyOrders(customerId) {
  const [orders] = await customerDb.execute(
    `SELECT order_id, order_date, status, total_amount, payment_method,
            recipient_name, address_detail, postal_code
     FROM v_order_summary
     WHERE customer_id = ?
     ORDER BY order_date DESC`,
    [customerId]
  );

  const [items] = await customerDb.execute(
    `SELECT order_id, title, quantity, unit_price, line_total
     FROM v_order_detail
     WHERE customer_id = ?`,
    [customerId]
  );

  // put the items under their order
  for (const order of orders) {
    order.items = items.filter((item) => item.order_id === order.order_id);
  }
  return orders;
}

// ----- staff side -----

async function getAllOrders() {
  const [rows] = await staffDb.execute(
    'SELECT * FROM v_order_summary ORDER BY order_date DESC'
  );
  return rows;
}

// if the new status is Cancelled, trigger trg_order_cancelled puts the books back
async function updateStatus(orderId, status) {
  await staffDb.execute(
    'UPDATE orders SET status = ? WHERE order_id = ?', [status, orderId]
  );
}

module.exports = { placeOrder, getMyOrders, getAllOrders, updateStatus };
