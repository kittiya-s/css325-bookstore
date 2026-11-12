loadNav();

document.getElementById('staffLoginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('/api/staff/login', {
      method: 'POST',
      body: {
        username: document.getElementById('username').value,
        password: document.getElementById('password').value
      }
    });
    window.location.href = '/staff.html';
  } catch (err) {
    showMessage(err.message, 'error');
  }
});
