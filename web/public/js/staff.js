// fill a <table> with a header row and data rows
function fillTable(id, headers, rows) {
  const head = headers.length ? `<tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr>` : '';
  const body = rows.length
    ? rows.map((cells) => `<tr>${cells.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')
    : '<tr><td>None</td></tr>';
  document.getElementById(id).innerHTML = head + body;
}

async function loadDashboard() {
  const d = await api('/api/staff/dashboard');

  document.getElementById('numOrders').textContent = d.summary.num_orders;
  document.getElementById('totalSales').textContent = `฿${money(d.summary.total_sales)}`;
  document.getElementById('avgOrder').textContent = `฿${money(d.summary.avg_order)}`;

  fillTable('byCategory', ['Category', 'Copies', 'Revenue'],
    d.byCategory.map((r) => [esc(r.category_name), r.copies_sold, money(r.revenue)]));

  fillTable('byMonth', ['Month', 'Orders', 'Sales'],
    d.byMonth.map((r) => [esc(r.sales_month), r.num_orders, money(r.sales)]));

  fillTable('unpaid', [],
    d.unpaid.map((r) => [`#${r.order_id}`, esc(r.order_date), esc(r.status), money(r.total_amount)]));

  fillTable('lowStock', [],
    d.lowStock.map((r) => [esc(r.title), r.stock_qty,
      `<span class="badge ${badgeClass(r.availability)}">${esc(r.availability)}</span>`]));

  fillTable('topCustomers', [],
    d.topCustomers.map((r) => [esc(r.name), `฿${money(r.spent)}`]));

  fillTable('neverOrdered', [],
    d.neverOrdered.map((r) => [esc(r.title), `stock ${r.stock_qty}`]));
}

requireLogin('staff')
  .then((me) => { if (me.isStaff) return loadDashboard(); })
  .catch((err) => showMessage(err.message, 'error'));
