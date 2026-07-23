const API_BASE_URL = `${import.meta.env.VITE_API_URL || window.location.origin}/api`;

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

function getUpcomingReminders() {
  return request('/events/upcoming-reminders');
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

function getMyProfile() {
  return request('/users/me');
}

function updateProfile(payload) {
  return request('/users/me', { method: 'PUT', body: payload });
}

function updateCurrentUser(patch) {
  const user = { ...getCurrentUser(), ...patch };
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

function getActivityLog() {
  return request('/activity-logs');
}

function getUpdateRequests() {
  return request('/update-requests');
}

function generateUpdateRequestDraft(text) {
  return request('/update-requests/generate', { method: 'POST', body: { text } });
}

function createUpdateRequest(payload) {
  return request('/update-requests', { method: 'POST', body: payload });
}

function updateUpdateRequest(id, payload) {
  return request(`/update-requests/${id}`, { method: 'PUT', body: payload });
}

function deleteUpdateRequest(id) {
  return request(`/update-requests/${id}`, { method: 'DELETE' });
}

function getInvitations() {
  return request('/invitations');
}

function createInvitation(payload) {
  return request('/invitations', { method: 'POST', body: payload });
}

function respondInvitation(id, status) {
  return request(`/invitations/${id}`, { method: 'PUT', body: { status } });
}

function cancelInvitation(id) {
  return request(`/invitations/${id}`, { method: 'DELETE' });
}

function getFinanceCategories() {
  return request('/finance-categories');
}

function createFinanceCategory(category) {
  return request('/finance-categories', { method: 'POST', body: category });
}

function updateFinanceCategory(id, category) {
  return request(`/finance-categories/${id}`, { method: 'PUT', body: category });
}

function deleteFinanceCategory(id) {
  return request(`/finance-categories/${id}`, { method: 'DELETE' });
}

function getFinanceEntries(filters = {}) {
  const query = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== '')
  ).toString();
  return request(`/finance-entries${query ? `?${query}` : ''}`);
}

function createFinanceEntry(entry) {
  return request('/finance-entries', { method: 'POST', body: entry });
}

function updateFinanceEntry(id, entry) {
  return request(`/finance-entries/${id}`, { method: 'PUT', body: entry });
}

function deleteFinanceEntry(id) {
  return request(`/finance-entries/${id}`, { method: 'DELETE' });
}

function getFinanceReport(month, year, paidBy) {
  const query = new URLSearchParams({ month, year, ...(paidBy && { paidBy }) }).toString();
  return request(`/finance-entries/report?${query}`);
}

function getReimbursements() {
  return request('/reimbursements');
}

function createReimbursement(payload) {
  return request('/reimbursements', { method: 'POST', body: payload });
}

function settleReimbursement(id) {
  return request(`/reimbursements/${id}/quitar`, { method: 'PUT' });
}

function deleteReimbursement(id) {
  return request(`/reimbursements/${id}`, { method: 'DELETE' });
}

function getFinanceGoals(creator) {
  const query = creator ? `?${new URLSearchParams({ creator }).toString()}` : '';
  return request(`/finance-goals${query}`);
}

function createFinanceGoal(goal) {
  return request('/finance-goals', { method: 'POST', body: goal });
}

function updateFinanceGoal(id, goal) {
  return request(`/finance-goals/${id}`, { method: 'PUT', body: goal });
}

function deleteFinanceGoal(id) {
  return request(`/finance-goals/${id}`, { method: 'DELETE' });
}

function getFinanceMonths() {
  return request('/finance-months');
}

function createFinanceMonth(payload) {
  return request('/finance-months', { method: 'POST', body: payload });
}

function closeFinanceMonth(id) {
  return request(`/finance-months/${id}/fechar`, { method: 'PUT' });
}

function reopenFinanceMonth(id) {
  return request(`/finance-months/${id}/reabrir`, { method: 'PUT' });
}

function previewFinanceImport(file) {
  const form = new FormData();
  form.append('file', file);
  return request('/finance-import/preview', { method: 'POST', body: form, isForm: true });
}

function commitFinanceImport(payload) {
  return request('/finance-import/commit', { method: 'POST', body: payload });
}

function getEmotionEntries(filters = {}) {
  const query = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== '')
  ).toString();
  return request(`/emotion-entries${query ? `?${query}` : ''}`);
}

function createEmotionEntry(entry) {
  return request('/emotion-entries', { method: 'POST', body: entry });
}

function updateEmotionEntry(id, entry) {
  return request(`/emotion-entries/${id}`, { method: 'PUT', body: entry });
}

function deleteEmotionEntry(id) {
  return request(`/emotion-entries/${id}`, { method: 'DELETE' });
}

function getHabits(filters = {}) {
  const query = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== '')
  ).toString();
  return request(`/habits${query ? `?${query}` : ''}`);
}

function createHabit(payload) {
  return request('/habits', { method: 'POST', body: payload });
}

function updateHabit(id, payload) {
  return request(`/habits/${id}`, { method: 'PUT', body: payload });
}

function archiveHabit(id) {
  return request(`/habits/${id}`, { method: 'DELETE' });
}

function getHabitCheckins(filters = {}) {
  const query = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== '')
  ).toString();
  return request(`/habit-checkins${query ? `?${query}` : ''}`);
}

function createHabitCheckin(payload) {
  return request('/habit-checkins', { method: 'POST', body: payload });
}

function deleteHabitCheckin(id) {
  return request(`/habit-checkins/${id}`, { method: 'DELETE' });
}

function freezeHabit(id, day) {
  return request(`/habits/${id}/freeze`, { method: 'POST', body: { day } });
}

function setHabitCheckinReaction(id, emoji) {
  return request(`/habit-checkins/${id}/reactions`, { method: 'POST', body: { emoji } });
}

function removeHabitCheckinReaction(id) {
  return request(`/habit-checkins/${id}/reactions`, { method: 'DELETE' });
}

function getVapidPublicKey() {
  return request('/push/vapid-public-key');
}

function subscribePush(subscription) {
  return request('/push/subscribe', { method: 'POST', body: subscription });
}

function unsubscribePush(endpoint) {
  return request('/push/unsubscribe', { method: 'POST', body: { endpoint } });
}

function getWatchlistItems(filters = {}) {
  const query = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== '')
  ).toString();
  return request(`/watchlist-items${query ? `?${query}` : ''}`);
}

function createWatchlistItem(payload) {
  return request('/watchlist-items', { method: 'POST', body: payload });
}

function updateWatchlistItem(id, payload) {
  return request(`/watchlist-items/${id}`, { method: 'PUT', body: payload });
}

function deleteWatchlistItem(id) {
  return request(`/watchlist-items/${id}`, { method: 'DELETE' });
}

function getWatchlistRatings(filters = {}) {
  const query = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== '')
  ).toString();
  return request(`/watchlist-ratings${query ? `?${query}` : ''}`);
}

function createWatchlistRating(payload) {
  return request('/watchlist-ratings', { method: 'POST', body: payload });
}

function updateWatchlistRating(id, payload) {
  return request(`/watchlist-ratings/${id}`, { method: 'PUT', body: payload });
}

function deleteWatchlistRating(id) {
  return request(`/watchlist-ratings/${id}`, { method: 'DELETE' });
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
  getUpcomingReminders,
  uploadFile,
  getSettings,
  updateSettings,
  getUsers,
  getMyProfile,
  updateProfile,
  updateCurrentUser,
  getActivityLog,
  getUpdateRequests,
  generateUpdateRequestDraft,
  createUpdateRequest,
  updateUpdateRequest,
  deleteUpdateRequest,
  getInvitations,
  createInvitation,
  respondInvitation,
  cancelInvitation,
  getVapidPublicKey,
  subscribePush,
  unsubscribePush,
  getEmotionEntries,
  createEmotionEntry,
  updateEmotionEntry,
  deleteEmotionEntry,
  getHabits,
  createHabit,
  updateHabit,
  archiveHabit,
  getHabitCheckins,
  createHabitCheckin,
  deleteHabitCheckin,
  freezeHabit,
  setHabitCheckinReaction,
  removeHabitCheckinReaction,
  getFinanceCategories,
  createFinanceCategory,
  updateFinanceCategory,
  deleteFinanceCategory,
  getFinanceEntries,
  createFinanceEntry,
  updateFinanceEntry,
  deleteFinanceEntry,
  getFinanceReport,
  getReimbursements,
  createReimbursement,
  settleReimbursement,
  deleteReimbursement,
  getFinanceGoals,
  createFinanceGoal,
  updateFinanceGoal,
  deleteFinanceGoal,
  getFinanceMonths,
  createFinanceMonth,
  closeFinanceMonth,
  reopenFinanceMonth,
  previewFinanceImport,
  commitFinanceImport,
  getWatchlistItems,
  createWatchlistItem,
  updateWatchlistItem,
  deleteWatchlistItem,
  getWatchlistRatings,
  createWatchlistRating,
  updateWatchlistRating,
  deleteWatchlistRating,
};

export { API_BASE_URL };
