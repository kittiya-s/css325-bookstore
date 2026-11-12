const table = document.getElementById('books');
const addForm = document.getElementById('addBookForm');

async function loadBooks() {
  const { books, categories } = await api('/api/staff/books');

  document.getElementById('category_id').innerHTML = categories
    .map((c) => `<option value="${c.category_id}">${esc(c.category_name)}</option>`).join('');

  table.innerHTML = `
    <tr><th>ID</th><th>Title</th><th>Author</th><th>Category</th><th>Price</th><th>Stock</th><th>Restock</th></tr>
    ${books.map((b) => `
      <tr class="${b.stock_qty < 10 ? 'warn' : ''}">
        <td>${b.book_id}</td>
        <td>${esc(b.title)}</td>
        <td>${esc(b.author)}</td>
        <td>${esc(b.category_name)}</td>
        <td>${money(b.price)}</td>
        <td>${b.stock_qty}</td>
        <td>
          <input type="number" min="1" value="10" class="tiny" data-book="${b.book_id}">
          <button class="small restock-btn" data-book="${b.book_id}">+</button>
        </td>
      </tr>`).join('')}`;
}

addForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const result = await api('/api/staff/books', {
      method: 'POST',
      body: {
        title: document.getElementById('title').value,
        author: document.getElementById('author').value,
        category_id: document.getElementById('category_id').value,
        price: document.getElementById('price').value,
        stock_qty: document.getElementById('stock_qty').value
      }
    });
    addForm.reset();
    showMessage(result.message);
    await loadBooks();
  } catch (err) {
    showMessage(err.message, 'error');
  }
});

table.addEventListener('click', async (e) => {
  if (!e.target.classList.contains('restock-btn')) return;

  const bookId = e.target.dataset.book;
  const amount = table.querySelector(`input[data-book="${bookId}"]`).value;
  try {
    const result = await api(`/api/staff/books/${bookId}/restock`, {
      method: 'POST',
      body: { amount }
    });
    showMessage(result.message);
    await loadBooks();
  } catch (err) {
    showMessage(err.message, 'error');
  }
});

requireLogin('staff')
  .then((me) => { if (me.isStaff) return loadBooks(); })
  .catch((err) => showMessage(err.message, 'error'));
