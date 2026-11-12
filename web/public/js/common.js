// shared helpers used by every page

// call our API and return the JSON. Throws an Error with the server's message.
async function api(url, options = {}) {
  const opts = { method: options.method || 'GET', headers: {} };
  if (options.body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong.');
  }
  return data;
}

// escape text before putting it into innerHTML (prevents XSS)
function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function money(value) {
  return Number(value).toFixed(2);
}

// availability text -> css class, e.g. "Low stock" -> "low-stock"
function badgeClass(text) {
  return text.toLowerCase().replace(/ /g, '-');
}

function showMessage(text, type = 'success') {
  const box = document.getElementById('message');
  box.textContent = text;
  box.className = `flash ${type}`;
  box.hidden = false;
  window.scrollTo(0, 0);
}

// keep a message for the next page (after redirect)
function messageForNextPage(text, type = 'success') {
  try {
    sessionStorage.setItem('flash', JSON.stringify({ text, type }));
  } catch (e) { /* ignore */ }
}

function showSavedMessage() {
  try {
    const saved = sessionStorage.getItem('flash');
    if (saved) {
      const { text, type } = JSON.parse(saved);
      showMessage(text, type);
      sessionStorage.removeItem('flash');
    }
  } catch (e) { /* ignore */ }
}

// build the top menu depending on who is logged in
async function loadNav() {
  const me = await api('/api/me');
  const nav = document.getElementById('nav');

  if (me.isStaff) {
    nav.innerHTML = `
      <a href="/staff.html">Dashboard</a>
      <a href="/staff-orders.html">Orders</a>
      <a href="/staff-books.html">Books</a>
      <button id="logoutBtn" class="link">Log out</button>`;
  } else if (me.customer) {
    nav.innerHTML = `
      <a href="/">Books</a>
      <a href="/orders.html">My orders</a>
      <a href="/addresses.html">Addresses</a>
      <span class="hello">Hi, ${esc(me.customer.name)}</span>
      <button id="logoutBtn" class="link">Log out</button>`;
  } else {
    nav.innerHTML = `
      <a href="/">Books</a>
      <a href="/login.html">Log in</a>
      <a href="/register.html">Register</a>
      <a href="/staff-login.html" class="muted">Staff</a>`;
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await api('/api/logout', { method: 'POST' });
      window.location.href = me.isStaff ? '/staff-login.html' : '/';
    });
  }

  showSavedMessage();
  return me;
}

// for pages that need a login
async function requireLogin(type) {
  const me = await loadNav();
  if (type === 'customer' && !me.customer) {
    messageForNextPage('Please log in first.', 'error');
    window.location.href = '/login.html';
  }
  if (type === 'staff' && !me.isStaff) {
    window.location.href = '/staff-login.html';
  }
  return me;
}
