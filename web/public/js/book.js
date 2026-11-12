const bookId = new URLSearchParams(window.location.search).get('id');
const detail = document.getElementById('detail');

const METHODS = ['Credit Card', 'Bank Transfer', 'PromptPay', 'Cash on Delivery'];

function buyFormHtml(me, addresses) {
  if (!me.customer) {
    return '<p><a href="/login.html">Log in</a> to buy this book.</p>';
  }
  if (addresses.length === 0) {
    return '<p>You need a shipping address first. <a href="/addresses.html">Add one</a>.</p>';
  }
  return `
    <form id="buyForm" class="box">
      <label>Quantity
        <input type="number" id="quantity" min="1" value="1" required>
      </label>
      <label>Ship to
        <select id="address_id">
          ${addresses.map((a) => `<option value="${a.address_id}">${esc(a.recipient_name)} - ${esc(a.address_detail)} ${esc(a.postal_code)}</option>`).join('')}
        </select>
      </label>
      <label>Payment
        <select id="method">
          ${METHODS.map((m) => `<option>${m}</option>`).join('')}
        </select>
      </label>
      <button>Buy now</button>
    </form>`;
}

async function loadBook() {
  const me = await loadNav();
  const book = await api(`/api/books/${encodeURIComponent(bookId)}`);
  const addresses = me.customer ? await api('/api/addresses') : [];

  document.title = `${book.title} | Too Cute Books`;
  detail.innerHTML = `
    <div class="cover big"><span>${esc(book.title)}</span></div>
    <div>
      <h1>${esc(book.title)}</h1>
      <p>by ${esc(book.author)}</p>
      <p>Category: ${esc(book.category_name)}</p>
      <p class="price">฿${money(book.price)}</p>
      <p>Stock: ${book.stock_qty} <span class="badge ${badgeClass(book.availability)}">${esc(book.availability)}</span></p>
      ${buyFormHtml(me, addresses)}
    </div>`;

  const buyForm = document.getElementById('buyForm');
  if (buyForm) buyForm.addEventListener('submit', buy);
}

async function buy(e) {
  e.preventDefault();
  try {
    const result = await api('/api/orders', {
      method: 'POST',
      body: {
        book_id: bookId,
        address_id: document.getElementById('address_id').value,
        quantity: document.getElementById('quantity').value,
        method: document.getElementById('method').value
      }
    });
    messageForNextPage(result.message);
    window.location.href = '/orders.html';
  } catch (err) {
    // e.g. "Not enough stock for this book" from our trigger
    showMessage(err.message, 'error');
  }
}

loadBook().catch((err) => showMessage(err.message, 'error'));
