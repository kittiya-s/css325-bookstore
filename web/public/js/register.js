loadNav();

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('/api/register', {
      method: 'POST',
      body: {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value
      }
    });
    messageForNextPage('Account created. Please add a shipping address.');
    window.location.href = '/addresses.html';
  } catch (err) {
    showMessage(err.message, 'error');
  }
});
