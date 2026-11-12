async function loadOrders() {
  const orders = await api('/api/orders');
  document.getElementById('empty').hidden = orders.length > 0;

  document.getElementById('orders').innerHTML = orders.map((o) => `
    <div class="box">
      <div class="row">
        <strong>Order #${o.order_id}</strong>
        <span class="status ${o.status.toLowerCase()}">${esc(o.status)}</span>
      </div>
      <small>${esc(o.order_date)} · Ship to ${esc(o.recipient_name)}, ${esc(o.address_detail)} ${esc(o.postal_code)} · ${esc(o.payment_method)}</small>
      <table>
        <tr><th>Book</th><th>Qty</th><th>Price</th><th>Total</th></tr>
        ${o.items.map((it) => `
          <tr>
            <td>${esc(it.title)}</td>
            <td>${it.quantity}</td>
            <td>${money(it.unit_price)}</td>
            <td>${money(it.line_total)}</td>
          </tr>`).join('')}
        <tr>
          <td colspan="3"><strong>Order total</strong></td>
          <td><strong>฿${money(o.total_amount)}</strong></td>
        </tr>
      </table>
    </div>`).join('');
}

requireLogin('customer')
  .then((me) => { if (me.customer) return loadOrders(); })
  .catch((err) => showMessage(err.message, 'error'));
