import { api } from '../api.js';
import { showToast, setButtonLoading } from '../toast.js';

if (api.getToken()) {
  window.location.href = 'calendar.html';
}

const heroEl = document.getElementById('auth-hero');
if (heroEl) {
  // cataas.com sorteia um gatinho real a cada chamada; o timestamp evita cache do navegador.
  const photoUrl = `https://cataas.com/cat?width=1600&height=2000&_=${Date.now()}`;
  const preload = new Image();
  preload.onload = () => {
    heroEl.style.backgroundImage = `url('${photoUrl}')`;
  };
  preload.src = photoUrl;
}

const form = document.getElementById('login-form');
const btnSubmit = document.getElementById('btn-submit');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const name = document.getElementById('name').value.trim();
  const password = document.getElementById('password').value;

  setButtonLoading(btnSubmit, true);

  try {
    await api.login({ name, password });
    window.location.href = 'calendar.html';
  } catch (err) {
    showToast(err.message, 'error');
    setButtonLoading(btnSubmit, false);
  }
});
