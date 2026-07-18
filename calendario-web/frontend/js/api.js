const API_BASE_URL = `${window.location.origin}/api`;

const TOKEN_KEY = 'calendario_token';
const USER_KEY = 'calendario_user';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getCurrentUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request(path, { method = 'GET', body, isForm = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isForm && body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: isForm ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error((data && data.message) || `Erro na requisição (${response.status})`);
  }

  return data;
}

async function register({ name, password }) {
  const data = await request('/auth/register', { method: 'POST', body: { name, password } });
  saveSession(data.token, data.user);
  return data;
}

async function login({ name, password }) {
  const data = await request('/auth/login', { method: 'POST', body: { name, password } });
  saveSession(data.token, data.user);
  return data;
}

function getEvents() {
  return request('/events');
}

function createEvent(event) {
  return request('/events', { method: 'POST', body: event });
}

function updateEvent(id, event) {
  return request(`/events/${id}`, { method: 'PUT', body: event });
}

function deleteEvent(id) {
  return request(`/events/${id}`, { method: 'DELETE' });
}

function uploadFile(file) {
  const form = new FormData();
  form.append('file', file);
  return request('/upload', { method: 'POST', body: form, isForm: true });
}

function getSettings() {
  return request('/settings');
}

function updateSettings(settings) {
  return request('/settings', { method: 'PUT', body: settings });
}

function getUsers() {
  return request('/users');
}

export const api = {
  register,
  login,
  logout,
  getCurrentUser,
  getToken,
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  uploadFile,
  getSettings,
  updateSettings,
  getUsers,
};

export { API_BASE_URL };
