const form = document.getElementById('filterForm');
const qInput = document.getElementById('q');
const categorySelect = document.getElementById('category');

async function loadCategories() {
  const categories = await api('/api/categories');
  for (const c of categories) {
    const option = document.createElement('option');
    option.value = c.category_id;
    option.textContent = c.category_name;
    categorySelect.appendChild(option);
  }
}

async function loadBooks() {
  const params = new URLSearchParams({ q: qInput.value, category: categorySelect.value });
  const books = await api(`/api/books?${params}`);

  document.getElementById('empty').hidden = books.length > 0;
  document.getElementById('books').innerHTML = books.map((b) => `
    <a class="card" href="/book.html?id=${b.book_id}">
      <div class="cover"><span>${esc(b.title)}</span></div>
      <div class="card-body">
        <strong>${esc(b.title)}</strong>
        <small>${esc(b.author)} · ${esc(b.category_name)}</small>
        <div class="row">
          <span class="price">฿${money(b.price)}</span>
          <span class="badge ${badgeClass(b.availability)}">${esc(b.availability)}</span>
        </div>
      </div>
    </a>`).join('');
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  loadBooks().catch((err) => showMessage(err.message, 'error'));
});

loadNav()
  .then(loadCategories)
  .then(loadBooks)
  .catch((err) => showMessage(err.message, 'error'));
