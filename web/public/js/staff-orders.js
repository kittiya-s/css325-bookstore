const table = document.getElementById('orders');

async function loadOrders() {
  const { orders, statuses } = await api('/api/staff/orders');

  table.innerHTML = `
    <tr><th>#</th><th>Customer</th><th>Ship to</th><th>Date</th><th>Total</th><th>Payment</th><th>Status</th></tr>
    ${orders.map((o) => `
      <tr>
        <td>${o.order_id}</td>
        <td>${esc(o.customer_name)}</td>
        <td>${esc(o.recipient_name)} (${esc(o.postal_code)})</td>
        <td>${esc(o.order_date)}</td>
        <td>${money(o.total_amount)}</td>
        <td>${esc(o.payment_method)}</td>
        <td>
          <select data-order="${o.order_id}">
            ${statuses.map((s) => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
          <button class="small save-btn" data-order="${o.order_id}">Save</button>
        </td>
      </tr>`).join('')}`;
}

// one click handler for all Save buttons
table.addEventListener('click', async (e) => {
  if (!e.target.classList.contains('save-btn')) return;

  const orderId = e.target.dataset.order;
  const status = table.querySelector(`select[data-order="${orderId}"]`).value;
  try {
    const result = await api(`/api/staff/orders/${orderId}/status`, {
      method: 'PUT',
      body: { status }
    });
    showMessage(result.message);
    await loadOrders();
  } catch (err) {
    showMessage(err.message, 'error');
  }
});

requireLogin('staff')
  .then((me) => { if (me.isStaff) return loadOrders(); })
  .catch((err) => showMessage(err.message, 'error'));
