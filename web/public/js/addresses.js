const addressForm = document.getElementById('addressForm');

async function loadAddresses() {
  const addresses = await api('/api/addresses');
  document.getElementById('empty').hidden = addresses.length > 0;
  document.getElementById('addressList').innerHTML = addresses.map((a) => `
    <li><strong>${esc(a.recipient_name)}</strong> - ${esc(a.address_detail)} ${esc(a.postal_code)}</li>`).join('');
}

addressForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const result = await api('/api/addresses', {
      method: 'POST',
      body: {
        recipient_name: document.getElementById('recipient_name').value,
        address_detail: document.getElementById('address_detail').value,
        postal_code: document.getElementById('postal_code').value
      }
    });
    addressForm.reset();
    showMessage(result.message);
    await loadAddresses();
  } catch (err) {
    showMessage(err.message, 'error');
  }
});

requireLogin('customer')
  .then((me) => { if (me.customer) return loadAddresses(); })
  .catch((err) => showMessage(err.message, 'error'));
