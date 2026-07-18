import { api } from '../api.js';
import { showToast, setButtonLoading } from '../toast.js';

if (api.getToken()) {
  window.location.href = 'calendar.html';
}

const form = document.getElementById('login-form');
const btnSubmit = document.getElementById('btn-submit');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  setButtonLoading(btnSubmit, true);

  try {
    await api.login({ email, password });
    window.location.href = 'calendar.html';
  } catch (err) {
    showToast(err.message, 'error');
    setButtonLoading(btnSubmit, false);
  }
});
