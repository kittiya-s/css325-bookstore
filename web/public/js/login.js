loadNav();

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('/api/login', {
      method: 'POST',
      body: {
        email: document.getElementById('email').value,
        password: document.getElementById('password').value
      }
    });
    window.location.href = '/';
  } catch (err) {
    showMessage(err.message, 'error');
  }
});
