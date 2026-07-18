import { api, API_BASE_URL } from '../api.js';
import { showToast, setButtonLoading } from '../toast.js';

if (!api.getToken()) {
  window.location.href = 'login.html';
}

const API_ORIGIN = API_BASE_URL.replace(/\/api$/, '');
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const IMAGE_MIME = /^image\//;

const state = {
  viewDate: new Date(),
  events: [],
  users: [],
  selectedDateKey: null,
  editingEventId: null,
  pendingFiles: [],
  existingAttachments: [],
  filters: { search: '', creatorId: '', onlyWithAttachment: false },
};

const el = {
  sidebar: document.querySelector('.sidebar'),
  btnToggleSidebar: document.getElementById('btn-toggle-sidebar'),
  userName: document.getElementById('user-name'),
  userAvatar: document.getElementById('user-avatar'),
  btnTheme: document.getElementById('btn-theme'),
  btnLogout: document.getElementById('btn-logout'),
  btnQuickNewEvent: document.getElementById('btn-quick-new-event'),
  navItems: document.querySelectorAll('.sidebar-nav-item'),
  viewCalendar: document.getElementById('view-calendar'),
  viewSettings: document.getElementById('view-settings'),
  upcomingList: document.getElementById('upcoming-events-list'),
  usersList: document.getElementById('users-list'),

  filterSearch: document.getElementById('filter-search'),
  filterCreator: document.getElementById('filter-creator'),
  filterAttachment: document.getElementById('filter-attachment'),

  calendarTitle: document.getElementById('calendar-title'),
  calendarWeekdays: document.getElementById('calendar-weekdays'),
  calendarGrid: document.getElementById('calendar-grid'),
  btnPrevMonth: document.getElementById('btn-prev-month'),
  btnNextMonth: document.getElementById('btn-next-month'),

  settingsForm: document.getElementById('settings-form'),
  settingsTheme: document.getElementById('settings-theme'),
  settingsBackground: document.getElementById('settings-background'),
  settingsError: document.getElementById('settings-error'),
  btnSaveSettings: document.getElementById('btn-save-settings'),

  modalOverlay: document.getElementById('modal-overlay'),
  modalTitle: document.getElementById('modal-title'),
  modalClose: document.getElementById('modal-close'),
  eventListView: document.getElementById('event-list-view'),
  eventList: document.getElementById('event-list'),
  btnNewEvent: document.getElementById('btn-new-event'),
  eventForm: document.getElementById('event-form'),
  eventId: document.getElementById('event-id'),
  eventDate: document.getElementById('event-date'),
  eventTitle: document.getElementById('event-title'),
  eventDescription: document.getElementById('event-description'),
  eventFiles: document.getElementById('event-files'),
  attachmentsPreview: document.getElementById('event-attachments-preview'),
  formError: document.getElementById('form-error'),
  btnCancelForm: document.getElementById('btn-cancel-form'),
  btnDeleteEvent: document.getElementById('btn-delete-event'),
  btnSaveEvent: document.getElementById('btn-save-event'),
};

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function dateKeyToNoonISO(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0).toISOString();
}

function fileUrl(path) {
  if (!path) return '';
  return path.startsWith('http') ? path : `${API_ORIGIN}${path}`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function matchesFilters(event) {
  const { search, creatorId, onlyWithAttachment } = state.filters;

  if (creatorId && event.creator?._id !== creatorId) return false;
  if (onlyWithAttachment && (!event.attachments || event.attachments.length === 0)) return false;

  if (search) {
    const term = search.toLowerCase();
    const haystack = `${event.title} ${event.description || ''}`.toLowerCase();
    if (!haystack.includes(term)) return false;
  }

  return true;
}

function filteredEvents() {
  return state.events.filter(matchesFilters);
}

function eventsByDateKey(dateKey) {
  return filteredEvents()
    .filter((event) => toDateKey(new Date(event.date)) === dateKey)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

/* ---------- Sidebar ---------- */

function renderUsersSidebar() {
  if (state.users.length === 0) {
    el.usersList.innerHTML = '<p class="sidebar-empty">Nenhum usuário ainda</p>';
  } else {
    el.usersList.innerHTML = state.users
      .map((user) => `<div class="sidebar-list-item">${escapeHtml(user.name)}</div>`)
      .join('');
  }

  el.filterCreator.innerHTML =
    '<option value="">Todos os usuários</option>' +
    state.users.map((user) => `<option value="${user._id}">${escapeHtml(user.name)}</option>`).join('');
}

function renderUpcomingEvents() {
  const todayKey = toDateKey(new Date());
  const upcoming = filteredEvents()
    .filter((event) => toDateKey(new Date(event.date)) >= todayKey)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  if (upcoming.length === 0) {
    el.upcomingList.innerHTML = '<p class="sidebar-empty">Nenhum evento futuro</p>';
    return;
  }

  el.upcomingList.innerHTML = upcoming
    .map((event) => {
      const dateKey = toDateKey(new Date(event.date));
      const [, m, d] = dateKey.split('-');
      return `
        <div class="sidebar-list-item is-clickable" data-date="${dateKey}">
          <span>${escapeHtml(event.title)}</span>
          <span>${d}/${m}</span>
        </div>
      `;
    })
    .join('');

  el.upcomingList.querySelectorAll('[data-date]').forEach((item) => {
    item.addEventListener('click', () => openDayModal(item.dataset.date));
  });
}

function playFadeIn(element) {
  element.classList.remove('fade-in');
  void element.offsetWidth;
  element.classList.add('fade-in');
}

function switchView(view) {
  el.navItems.forEach((item) => item.classList.toggle('is-active', item.dataset.view === view));
  el.viewCalendar.classList.toggle('hidden', view !== 'calendar');
  el.viewSettings.classList.toggle('hidden', view !== 'settings');
  playFadeIn(view === 'calendar' ? el.viewCalendar : el.viewSettings);
}

el.navItems.forEach((item) => {
  item.addEventListener('click', () => switchView(item.dataset.view));
});

el.btnQuickNewEvent.addEventListener('click', () => {
  openEventForm(null, toDateKey(new Date()));
  el.modalOverlay.classList.add('is-open');
});

/* ---------- Sidebar retrátil ---------- */

const SIDEBAR_COLLAPSED_KEY = 'calendario_sidebar_collapsed';

function setSidebarCollapsed(collapsed) {
  el.sidebar.classList.toggle('is-collapsed', collapsed);
  localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
}

el.btnToggleSidebar.addEventListener('click', () => {
  setSidebarCollapsed(!el.sidebar.classList.contains('is-collapsed'));
});

/* ---------- Filtros ---------- */

el.filterSearch.addEventListener('input', () => {
  state.filters.search = el.filterSearch.value.trim();
  renderCalendar();
  renderUpcomingEvents();
});

el.filterCreator.addEventListener('change', () => {
  state.filters.creatorId = el.filterCreator.value;
  renderCalendar();
  renderUpcomingEvents();
});

el.filterAttachment.addEventListener('change', () => {
  state.filters.onlyWithAttachment = el.filterAttachment.checked;
  renderCalendar();
  renderUpcomingEvents();
});

/* ---------- Calendário ---------- */

function renderWeekdays() {
  el.calendarWeekdays.innerHTML = WEEKDAYS.map((w) => `<div class="calendar-weekday">${w}</div>`).join('');
}

function buildMonthCells(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];

  for (let i = 0; i < firstDay.getDay(); i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(new Date(year, month, d));

  return cells;
}

function renderCalendar() {
  el.calendarTitle.textContent = state.viewDate.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  const todayKey = toDateKey(new Date());
  const cells = buildMonthCells(state.viewDate);

  el.calendarGrid.innerHTML = cells
    .map((date) => {
      if (!date) return '<div class="calendar-day is-empty"></div>';

      const dateKey = toDateKey(date);
      const dayEvents = eventsByDateKey(dateKey);
      const isToday = dateKey === todayKey;

      const dayAttachments = dayEvents.flatMap((event) => event.attachments || []);
      const dayImages = dayAttachments.filter((att) => IMAGE_MIME.test(att.mimetype));
      const hasOtherAttachment = dayAttachments.some((att) => !IMAGE_MIME.test(att.mimetype));

      const pills = dayEvents
        .slice(0, 3)
        .map((event) => `<span class="event-pill">${escapeHtml(event.title)}</span>`)
        .join('');
      const more = dayEvents.length > 3 ? `<span class="badge">+${dayEvents.length - 3} mais</span>` : '';

      const thumbs = dayImages
        .slice(0, 3)
        .map((att) => `<img class="calendar-day-thumb" src="${fileUrl(att.url)}" alt="${escapeHtml(att.name)}" />`)
        .join('');

      return `
        <div class="calendar-day${isToday ? ' is-today' : ''}" data-date="${dateKey}">
          <div class="calendar-day-header">
            <span class="calendar-day-number">${date.getDate()}</span>
            ${hasOtherAttachment ? '<span class="calendar-day-attachment-badge">📎</span>' : ''}
          </div>
          <div class="calendar-day-events">${pills}${more}</div>
          ${thumbs ? `<div class="calendar-day-thumbs">${thumbs}</div>` : ''}
        </div>
      `;
    })
    .join('');

  el.calendarGrid.querySelectorAll('.calendar-day[data-date]').forEach((cell) => {
    cell.addEventListener('click', () => openDayModal(cell.dataset.date));
  });

  playFadeIn(el.calendarGrid);
}

function renderCalendarSkeleton() {
  el.calendarGrid.innerHTML = Array.from({ length: 35 })
    .map(() => '<div class="calendar-day-skeleton"></div>')
    .join('');
}

/* ---------- Modal do dia / formulário de evento ---------- */

function openDayModal(dateKey) {
  state.selectedDateKey = dateKey;
  const [y, m, d] = dateKey.split('-');
  el.modalTitle.textContent = `Eventos em ${d}/${m}/${y}`;

  renderEventList(dateKey);
  showListView();
  el.modalOverlay.classList.add('is-open');
}

function attachmentIcon(mimetype) {
  if (IMAGE_MIME.test(mimetype)) return null;
  if (mimetype === 'application/pdf') return '📄';
  return '📎';
}

function renderAttachmentList(attachments) {
  if (!attachments || attachments.length === 0) return '';

  return `
    <div class="attachments-preview">
      ${attachments
        .map((att) => {
          if (IMAGE_MIME.test(att.mimetype)) {
            return `<a class="attachment-item" href="${fileUrl(att.url)}" target="_blank" rel="noopener">
              <img class="attachment-thumb" src="${fileUrl(att.url)}" alt="${escapeHtml(att.name)}" />
              <span class="attachment-name">${escapeHtml(att.name)}</span>
            </a>`;
          }
          return `<a class="attachment-item" href="${fileUrl(att.url)}" target="_blank" rel="noopener">
            <span class="attachment-file">${attachmentIcon(att.mimetype)}</span>
            <span class="attachment-name">${escapeHtml(att.name)}</span>
          </a>`;
        })
        .join('')}
    </div>
  `;
}

function renderEventList(dateKey) {
  const dayEvents = eventsByDateKey(dateKey);

  if (dayEvents.length === 0) {
    el.eventList.innerHTML = '<p>Nenhum evento neste dia ainda.</p>';
    return;
  }

  el.eventList.innerHTML = dayEvents
    .map(
      (event) => `
        <div class="event-list-item-wrap" data-id="${event._id}">
          <div class="event-list-item">
            <div>
              <strong>${escapeHtml(event.title)}</strong><br />
              <span class="badge">por ${escapeHtml(event.creator?.name || 'desconhecido')}</span>
            </div>
            <button type="button" class="btn btn-secondary" data-edit="${event._id}">Editar</button>
          </div>
          ${renderAttachmentList(event.attachments)}
        </div>
      `
    )
    .join('');

  el.eventList.querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const event = dayEvents.find((e) => e._id === btn.dataset.edit);
      openEventForm(event, dateKey);
    });
  });
}

function showListView() {
  el.eventListView.classList.remove('hidden');
  el.eventForm.classList.add('hidden');
}

function showFormView() {
  el.eventListView.classList.add('hidden');
  el.eventForm.classList.remove('hidden');
}

function renderFormAttachmentsPreview() {
  const savedHtml = state.existingAttachments
    .map((att) => {
      if (IMAGE_MIME.test(att.mimetype)) {
        return `<div class="attachment-item">
          <img class="attachment-thumb" src="${fileUrl(att.url)}" alt="${escapeHtml(att.name)}" />
          <span class="attachment-name">${escapeHtml(att.name)}</span>
        </div>`;
      }
      return `<div class="attachment-item">
        <span class="attachment-file">${attachmentIcon(att.mimetype)}</span>
        <span class="attachment-name">${escapeHtml(att.name)}</span>
      </div>`;
    })
    .join('');

  const pendingHtml = state.pendingFiles
    .map((file) => {
      if (IMAGE_MIME.test(file.type)) {
        return `<div class="attachment-item">
          <img class="attachment-thumb" src="${URL.createObjectURL(file)}" alt="${escapeHtml(file.name)}" />
          <span class="attachment-name">${escapeHtml(file.name)}</span>
        </div>`;
      }
      return `<div class="attachment-item">
        <span class="attachment-file">${attachmentIcon(file.type) || '📎'}</span>
        <span class="attachment-name">${escapeHtml(file.name)}</span>
      </div>`;
    })
    .join('');

  el.attachmentsPreview.innerHTML = savedHtml + pendingHtml;
}

function openEventForm(event, dateKey) {
  state.pendingFiles = [];
  el.formError.textContent = '';
  el.eventFiles.value = '';

  if (event) {
    state.editingEventId = event._id;
    state.existingAttachments = event.attachments ? [...event.attachments] : [];
    el.eventId.value = event._id;
    el.eventDate.value = dateKey;
    el.eventTitle.value = event.title;
    el.eventDescription.value = event.description || '';
    el.btnDeleteEvent.classList.remove('hidden');
  } else {
    state.editingEventId = null;
    state.existingAttachments = [];
    el.eventId.value = '';
    el.eventDate.value = dateKey;
    el.eventTitle.value = '';
    el.eventDescription.value = '';
    el.btnDeleteEvent.classList.add('hidden');
  }

  renderFormAttachmentsPreview();
  showFormView();
}

function closeModal() {
  el.modalOverlay.classList.remove('is-open');
  state.editingEventId = null;
  state.pendingFiles = [];
  state.existingAttachments = [];
}

async function reloadEvents() {
  state.events = await api.getEvents();
  renderCalendar();
  renderUpcomingEvents();
}

el.eventFiles.addEventListener('change', () => {
  state.pendingFiles = Array.from(el.eventFiles.files || []);
  renderFormAttachmentsPreview();
});

el.eventForm.addEventListener('submit', async (formEvent) => {
  formEvent.preventDefault();
  el.formError.textContent = '';

  const title = el.eventTitle.value.trim();
  const description = el.eventDescription.value.trim();
  const dateKey = el.eventDate.value;

  if (!title) {
    el.formError.textContent = 'Informe um título para o evento';
    return;
  }

  setButtonLoading(el.btnSaveEvent, true);

  try {
    const uploaded = await Promise.all(state.pendingFiles.map((file) => api.uploadFile(file)));
    const attachments = [...state.existingAttachments, ...uploaded];

    const payload = {
      title,
      description,
      date: dateKeyToNoonISO(dateKey),
      attachments,
    };

    const wasEditing = Boolean(state.editingEventId);

    if (wasEditing) {
      await api.updateEvent(state.editingEventId, payload);
    } else {
      await api.createEvent(payload);
    }

    await reloadEvents();
    openDayModal(dateKey);
    showToast(wasEditing ? 'Evento atualizado' : 'Evento criado', 'success');
  } catch (err) {
    el.formError.textContent = err.message;
    showToast(err.message, 'error');
  } finally {
    setButtonLoading(el.btnSaveEvent, false);
  }
});

el.btnDeleteEvent.addEventListener('click', async () => {
  if (!state.editingEventId) return;
  if (!confirm('Excluir este evento?')) return;

  setButtonLoading(el.btnDeleteEvent, true);

  try {
    await api.deleteEvent(state.editingEventId);
    const dateKey = el.eventDate.value;
    await reloadEvents();
    openDayModal(dateKey);
    showToast('Evento excluído', 'success');
  } catch (err) {
    el.formError.textContent = err.message;
    showToast(err.message, 'error');
  } finally {
    setButtonLoading(el.btnDeleteEvent, false);
  }
});

el.btnNewEvent.addEventListener('click', () => openEventForm(null, state.selectedDateKey));
el.btnCancelForm.addEventListener('click', () => showListView());
el.modalClose.addEventListener('click', closeModal);
el.modalOverlay.addEventListener('click', (event) => {
  if (event.target === el.modalOverlay) closeModal();
});

el.btnPrevMonth.addEventListener('click', () => {
  state.viewDate = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth() - 1, 1);
  renderCalendar();
});

el.btnNextMonth.addEventListener('click', () => {
  state.viewDate = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth() + 1, 1);
  renderCalendar();
});

el.btnLogout.addEventListener('click', () => {
  api.logout();
  window.location.href = 'login.html';
});

/* ---------- Tema / configurações ---------- */

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  el.settingsTheme.value = theme;
}

el.btnTheme.addEventListener('click', async () => {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'light' ? 'dark' : 'light';
  applyTheme(next);

  try {
    await api.updateSettings({ theme: next });
  } catch (err) {
    console.error('Não foi possível salvar o tema compartilhado:', err.message);
  }
});

el.settingsForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  el.settingsError.textContent = '';
  setButtonLoading(el.btnSaveSettings, true);

  try {
    const settings = await api.updateSettings({
      theme: el.settingsTheme.value,
      background: el.settingsBackground.value.trim(),
    });
    applyTheme(settings.theme);
    showToast('Configurações salvas', 'success');
  } catch (err) {
    el.settingsError.textContent = err.message;
    showToast(err.message, 'error');
  } finally {
    setButtonLoading(el.btnSaveSettings, false);
  }
});

/* ---------- Inicialização ---------- */

function initialsOf(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

async function init() {
  const user = api.getCurrentUser();
  el.userName.textContent = user ? `Olá, ${user.name}` : '';
  el.userAvatar.textContent = user ? initialsOf(user.name) : '';

  setSidebarCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1');
  renderWeekdays();
  renderCalendarSkeleton();

  try {
    const settings = await api.getSettings();
    applyTheme(settings.theme || 'light');
    el.settingsBackground.value = settings.background || '';
  } catch (err) {
    console.error('Não foi possível carregar as configurações:', err.message);
  }

  try {
    state.users = await api.getUsers();
    renderUsersSidebar();
  } catch (err) {
    console.error('Não foi possível carregar os usuários:', err.message);
  }

  try {
    await reloadEvents();
  } catch (err) {
    if (err.message.includes('Token')) {
      api.logout();
      window.location.href = 'login.html';
    }
  }
}

init();
