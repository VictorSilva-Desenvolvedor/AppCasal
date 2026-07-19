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
  updateRequests: [],
  invitations: [],
  selectedDateKey: null,
  editingEventId: null,
  pendingFiles: [],
  existingAttachments: [],
  filters: { search: '', creatorId: '', onlyWithAttachment: false },
  galleryMonthKey: null,
  galleryPhotos: [],
  lightboxIndex: 0,
};

const el = {
  sidebar: document.querySelector('.sidebar'),
  sidebarBackdrop: document.getElementById('sidebar-backdrop'),
  btnToggleSidebar: document.getElementById('btn-toggle-sidebar'),
  userName: document.getElementById('user-name'),
  userAvatar: document.getElementById('user-avatar'),
  btnTheme: document.getElementById('btn-theme'),
  btnLogout: document.getElementById('btn-logout'),
  btnQuickNewEvent: document.getElementById('btn-quick-new-event'),
  navItems: document.querySelectorAll('.sidebar-nav-item'),
  viewCalendar: document.getElementById('view-calendar'),
  viewSettings: document.getElementById('view-settings'),
  viewActivity: document.getElementById('view-activity'),
  viewUpdates: document.getElementById('view-updates'),
  viewGallery: document.getElementById('view-gallery'),
  viewInvites: document.getElementById('view-invites'),
  upcomingList: document.getElementById('upcoming-events-list'),
  activityLogList: document.getElementById('activity-log-list'),

  galleryMonthStrip: document.getElementById('gallery-month-strip'),
  galleryGrid: document.getElementById('gallery-grid'),
  lightboxOverlay: document.getElementById('lightbox-overlay'),
  lightboxImage: document.getElementById('lightbox-image'),
  lightboxCaption: document.getElementById('lightbox-caption'),
  lightboxClose: document.getElementById('lightbox-close'),
  lightboxPrev: document.getElementById('lightbox-prev'),
  lightboxNext: document.getElementById('lightbox-next'),

  updateForm: document.getElementById('update-form'),
  updateTitle: document.getElementById('update-title'),
  updateDescription: document.getElementById('update-description'),
  updateError: document.getElementById('update-error'),
  btnSaveUpdate: document.getElementById('btn-save-update'),
  updateLists: {
    todo: document.getElementById('update-list-todo'),
    in_progress: document.getElementById('update-list-in_progress'),
    done: document.getElementById('update-list-done'),
  },
  updateCounts: {
    todo: document.getElementById('update-count-todo'),
    in_progress: document.getElementById('update-count-in_progress'),
    done: document.getElementById('update-count-done'),
  },

  inviteLists: {
    received: document.getElementById('invite-list-received'),
    sent: document.getElementById('invite-list-sent'),
  },
  inviteCounts: {
    received: document.getElementById('invite-count-received'),
    sent: document.getElementById('invite-count-sent'),
  },
  eventInviteSection: document.getElementById('event-invite-section'),
  eventInviteSelect: document.getElementById('event-invite-select'),
  btnEventInvite: document.getElementById('btn-event-invite'),
  eventInviteList: document.getElementById('event-invite-list'),
  eventInviteError: document.getElementById('event-invite-error'),

  filterBar: document.getElementById('filter-bar'),
  filterSearch: document.getElementById('filter-search'),
  filterCreator: document.getElementById('filter-creator'),
  filterAttachment: document.getElementById('filter-attachment'),

  calendarTitle: document.getElementById('calendar-title'),
  calendarWeekdays: document.getElementById('calendar-weekdays'),
  calendarGrid: document.getElementById('calendar-grid'),
  btnPrevMonth: document.getElementById('btn-prev-month'),
  btnNextMonth: document.getElementById('btn-next-month'),
  monthListContainer: document.getElementById('calendar-month-list'),
  btnBackToMonths: document.getElementById('btn-back-to-months'),

  settingsForm: document.getElementById('settings-form'),
  settingsTheme: document.getElementById('settings-theme'),
  settingsBackground: document.getElementById('settings-background'),
  settingsError: document.getElementById('settings-error'),
  btnSaveSettings: document.getElementById('btn-save-settings'),
  colorSwatchGrid: document.getElementById('color-swatch-grid'),

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
  eventRecurrence: document.getElementById('event-recurrence'),
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

function iconHtml(name, extraClass = '') {
  return `<svg class="icon${extraClass ? ` ${extraClass}` : ''}" aria-hidden="true"><use href="../assets/icons.svg#icon-${name}"></use></svg>`;
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

function isHiddenPastEvent(event) {
  if (event.recurring || !event.hideWhenPast) return false;
  return toDateKey(new Date(event.date)) < toDateKey(new Date());
}

function filteredEvents() {
  return state.events.filter(matchesFilters).filter((event) => !isHiddenPastEvent(event));
}

function matchesDateKey(event, dateKey) {
  const eventDate = new Date(event.date);
  if (toDateKey(eventDate) === dateKey) return true;
  if (!event.recurring) return false;

  const [y, m, d] = dateKey.split('-').map(Number);
  return y > eventDate.getFullYear() && eventDate.getMonth() + 1 === m && eventDate.getDate() === d;
}

function nextOccurrenceDate(event) {
  const original = new Date(event.date);
  if (!event.recurring) return original;

  const today = new Date();
  let candidate = new Date(today.getFullYear(), original.getMonth(), original.getDate(), 12, 0, 0);
  if (toDateKey(candidate) < toDateKey(today)) {
    candidate = new Date(today.getFullYear() + 1, original.getMonth(), original.getDate(), 12, 0, 0);
  }
  return candidate;
}

function eventsByDateKey(dateKey) {
  return filteredEvents()
    .filter((event) => matchesDateKey(event, dateKey))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

const PERSON_COLORS = [
  'var(--color-person-1)',
  'var(--color-person-2)',
  'var(--color-person-3)',
  'var(--color-person-4)',
  'var(--color-person-5)',
  'var(--color-person-6)',
];

function personColorFor(userId) {
  const index = state.users.findIndex((user) => user._id === userId);
  return PERSON_COLORS[index === -1 ? 0 : index % PERSON_COLORS.length];
}

function sharedEventIdSet() {
  return new Set(
    state.invitations
      .filter((inv) => inv.status === 'accepted')
      .map((inv) => inv.event?._id)
      .filter(Boolean)
  );
}

/* ---------- Sidebar ---------- */

function populateCreatorFilter() {
  el.filterCreator.innerHTML =
    '<option value="">Todos os usuários</option>' +
    state.users.map((user) => `<option value="${user._id}">${escapeHtml(user.name)}</option>`).join('');
}

function renderUpcomingEvents() {
  const todayKey = toDateKey(new Date());
  const sharedIds = sharedEventIdSet();
  const upcoming = filteredEvents()
    .map((event) => ({ event, occurrence: nextOccurrenceDate(event) }))
    .filter(({ occurrence }) => toDateKey(occurrence) >= todayKey)
    .sort((a, b) => a.occurrence - b.occurrence)
    .slice(0, 5);

  if (upcoming.length === 0) {
    el.upcomingList.innerHTML = '<p class="sidebar-empty">Nenhum evento futuro</p>';
    return;
  }

  el.upcomingList.innerHTML = upcoming
    .map(({ event, occurrence }) => {
      const dateKey = toDateKey(occurrence);
      const [, m, d] = dateKey.split('-');
      const dotColor = event.creator ? personColorFor(event.creator._id) : 'var(--color-text-muted)';
      const recurringIcon = event.recurring ? iconHtml('repeat', 'icon-inline') : '';
      const sharedIcon = sharedIds.has(event._id) ? iconHtml('heart', 'icon-inline shared-badge-icon') : '';
      return `
        <button type="button" class="sidebar-list-item is-clickable" data-date="${dateKey}">
          <span><span class="person-dot" style="background:${dotColor}"></span>${sharedIcon}${recurringIcon}${escapeHtml(event.title)}</span>
          <span>${d}/${m}</span>
        </button>
      `;
    })
    .join('');

  el.upcomingList.querySelectorAll('[data-date]').forEach((item) => {
    item.addEventListener('click', () => openDayModal(item.dataset.date));
  });
}

/* ---------- Log de atividades ---------- */

const ACTION_LABELS = {
  created: 'criou',
  updated: 'editou',
  deleted: 'excluiu',
};

function formatLogTimestamp(date) {
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function renderActivityLog(logs) {
  if (logs.length === 0) {
    el.activityLogList.innerHTML = '<p class="sidebar-empty">Nenhuma atividade registrada ainda</p>';
    return;
  }

  el.activityLogList.innerHTML = logs
    .map((log) => {
      const dotColor = log.actor ? personColorFor(log.actor._id) : 'var(--color-text-muted)';
      const actorName = log.actor?.name || 'desconhecido';
      const actionLabel = ACTION_LABELS[log.action] || log.action;
      return `
        <div class="activity-feed-item activity-feed-item--${log.action}">
          <div class="activity-feed-item-header">
            <span><span class="person-dot" style="background:${dotColor}"></span><strong>${escapeHtml(actorName)}</strong> ${actionLabel} "${escapeHtml(log.eventTitle)}"</span>
            <span class="badge">${formatLogTimestamp(log.createdAt)}</span>
          </div>
          ${log.details ? `<p class="activity-feed-item-details">${escapeHtml(log.details)}</p>` : ''}
        </div>
      `;
    })
    .join('');
}

async function loadActivityLog() {
  try {
    const logs = await api.getActivityLog();
    renderActivityLog(logs);
  } catch (err) {
    el.activityLogList.innerHTML = '<p class="sidebar-empty">Não foi possível carregar as atividades</p>';
  }
}

/* ---------- Pedidos de atualização ---------- */

function renderUpdateBoard() {
  const groups = { todo: [], in_progress: [], done: [] };
  state.updateRequests.forEach((item) => {
    (groups[item.status] || groups.todo).push(item);
  });

  Object.keys(groups).forEach((status) => {
    const items = groups[status];
    el.updateCounts[status].textContent = items.length;

    if (items.length === 0) {
      el.updateLists[status].innerHTML = '<p class="update-empty">Nada por aqui</p>';
      return;
    }

    el.updateLists[status].innerHTML = items
      .map((item) => {
        const dotColor = item.creator ? personColorFor(item.creator._id) : 'var(--color-text-muted)';
        const authorName = item.creator?.name || 'desconhecido';

        return `
          <div class="update-card" data-id="${item._id}" data-status="${item.status}" draggable="true">
            <div class="update-card-title">${escapeHtml(item.title)}</div>
            ${item.description ? `<div class="update-card-description">${escapeHtml(item.description)}</div>` : ''}
            <div class="update-card-footer">
              <span class="update-card-meta"><span class="person-dot" style="background:${dotColor}"></span>${escapeHtml(authorName)} · ${formatLogTimestamp(item.createdAt)}</span>
              <button type="button" class="update-card-delete" data-update-delete="${item._id}" title="Excluir" aria-label="Excluir pedido">${iconHtml('trash')}</button>
            </div>
          </div>
        `;
      })
      .join('');
  });

  el.viewUpdates.querySelectorAll('[data-update-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Excluir este pedido?')) return;
      try {
        await api.deleteUpdateRequest(btn.dataset.updateDelete);
        await loadUpdateRequests();
        showToast('Pedido excluído', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });

  el.viewUpdates.querySelectorAll('.update-card').forEach((card) => {
    card.addEventListener('dragstart', (event) => {
      event.dataTransfer.setData('text/plain', card.dataset.id);
      event.dataTransfer.effectAllowed = 'move';
      card.classList.add('dragging');
    });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
  });
}

function setupUpdateBoardDragDrop() {
  Object.entries(el.updateLists).forEach(([status, listEl]) => {
    listEl.addEventListener('dragover', (event) => {
      event.preventDefault();
      listEl.classList.add('drag-over');
    });

    listEl.addEventListener('dragleave', (event) => {
      if (listEl.contains(event.relatedTarget)) return;
      listEl.classList.remove('drag-over');
    });

    listEl.addEventListener('drop', async (event) => {
      event.preventDefault();
      listEl.classList.remove('drag-over');

      const id = event.dataTransfer.getData('text/plain');
      const item = state.updateRequests.find((i) => i._id === id);
      if (!item || item.status === status) return;

      try {
        await api.updateUpdateRequest(id, { status });
        await loadUpdateRequests();
        showToast('Status atualizado', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });
}

async function loadUpdateRequests() {
  try {
    state.updateRequests = await api.getUpdateRequests();
    renderUpdateBoard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

setupUpdateBoardDragDrop();

/* ---------- Convites ---------- */

const INVITE_STATUS_LABELS = { pending: 'Pendente', accepted: 'Aceito', declined: 'Recusado' };

function renderInviteCard(inv, direction) {
  const otherUser = direction === 'received' ? inv.inviter : inv.invitee;
  const dateLabel = inv.event ? new Date(inv.event.date).toLocaleDateString('pt-BR') : '';
  const statusLabel = INVITE_STATUS_LABELS[inv.status];
  const actions =
    direction === 'received' && inv.status === 'pending'
      ? `<button type="button" class="btn btn-primary" data-invite-accept="${inv._id}">Aceitar</button>
         <button type="button" class="btn btn-danger" data-invite-decline="${inv._id}">Recusar</button>`
      : direction === 'sent' && inv.status === 'pending'
      ? `<button type="button" class="btn btn-secondary" data-invite-cancel="${inv._id}">Cancelar</button>`
      : `<span class="badge">${statusLabel}</span>`;

  return `
    <div class="update-card" data-id="${inv._id}">
      <div class="update-card-title">${escapeHtml(inv.event?.title || 'Evento removido')}</div>
      <div class="update-card-description">${dateLabel} · ${direction === 'received' ? 'De' : 'Para'} ${escapeHtml(otherUser?.name || 'desconhecido')}</div>
      <div class="update-card-footer">
        <span class="update-card-meta">${statusLabel}</span>
        <div class="update-card-actions">${actions}</div>
      </div>
    </div>
  `;
}

function renderInviteBoard() {
  const me = api.getCurrentUser();
  const received = state.invitations.filter((inv) => inv.invitee?._id === me._id);
  const sent = state.invitations.filter((inv) => inv.inviter?._id === me._id);

  el.inviteCounts.received.textContent = received.length;
  el.inviteCounts.sent.textContent = sent.length;

  el.inviteLists.received.innerHTML = received.length
    ? received.map((inv) => renderInviteCard(inv, 'received')).join('')
    : '<p class="update-empty">Nenhum convite recebido</p>';
  el.inviteLists.sent.innerHTML = sent.length
    ? sent.map((inv) => renderInviteCard(inv, 'sent')).join('')
    : '<p class="update-empty">Nenhum convite enviado</p>';

  el.viewInvites.querySelectorAll('[data-invite-accept]').forEach((btn) => {
    btn.addEventListener('click', () => respondToInvite(btn.dataset.inviteAccept, 'accepted'));
  });
  el.viewInvites.querySelectorAll('[data-invite-decline]').forEach((btn) => {
    btn.addEventListener('click', () => respondToInvite(btn.dataset.inviteDecline, 'declined'));
  });
  el.viewInvites.querySelectorAll('[data-invite-cancel]').forEach((btn) => {
    btn.addEventListener('click', () => cancelInvite(btn.dataset.inviteCancel));
  });
}

async function respondToInvite(id, status) {
  try {
    await api.respondInvitation(id, status);
    await reloadInvitations();
    showToast(status === 'accepted' ? 'Convite aceito' : 'Convite recusado', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function cancelInvite(id) {
  if (!confirm('Cancelar este convite?')) return;

  try {
    await api.cancelInvitation(id);
    await reloadInvitations();
    showToast('Convite cancelado', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function invitableUsers(event) {
  if (!event) return [];
  const invitedIds = new Set(
    state.invitations
      .filter((inv) => inv.event?._id === event._id && inv.status !== 'declined')
      .map((inv) => inv.invitee?._id)
  );
  return state.users.filter((u) => u._id !== event.creator?._id && !invitedIds.has(u._id));
}

function renderEventInviteSection(event) {
  const me = api.getCurrentUser();
  const isCreator = Boolean(event) && event.creator?._id === me._id;

  el.eventInviteSection.classList.toggle('hidden', !isCreator);
  if (!isCreator) return;

  const invitable = invitableUsers(event);
  el.eventInviteSelect.innerHTML = invitable.length
    ? invitable.map((u) => `<option value="${u._id}">${escapeHtml(u.name)}</option>`).join('')
    : '<option value="">Ninguém disponível para convidar</option>';
  el.btnEventInvite.disabled = invitable.length === 0;

  const invites = state.invitations.filter((inv) => inv.event?._id === event._id);
  el.eventInviteList.innerHTML = invites
    .map(
      (inv) => `
        <div class="event-invite-item">
          <span>${escapeHtml(inv.invitee?.name || 'desconhecido')} · ${INVITE_STATUS_LABELS[inv.status]}</span>
          ${inv.status === 'pending' ? `<button type="button" class="update-card-delete" data-cancel-invite="${inv._id}" title="Cancelar" aria-label="Cancelar convite">${iconHtml('trash')}</button>` : ''}
        </div>
      `
    )
    .join('');

  el.eventInviteList.querySelectorAll('[data-cancel-invite]').forEach((btn) => {
    btn.addEventListener('click', () => cancelInvite(btn.dataset.cancelInvite));
  });
}

el.btnEventInvite.addEventListener('click', async () => {
  el.eventInviteError.textContent = '';
  const inviteeId = el.eventInviteSelect.value;
  if (!inviteeId || !state.editingEventId) return;

  setButtonLoading(el.btnEventInvite, true);
  try {
    await api.createInvitation({ eventId: state.editingEventId, inviteeId });
    await reloadInvitations();
    showToast('Convite enviado', 'success');
  } catch (err) {
    el.eventInviteError.textContent = err.message;
    showToast(err.message, 'error');
  } finally {
    setButtonLoading(el.btnEventInvite, false);
  }
});

el.updateForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  el.updateError.textContent = '';

  const title = el.updateTitle.value.trim();
  const description = el.updateDescription.value.trim();

  if (!title) {
    el.updateError.textContent = 'Informe um título para o pedido';
    return;
  }

  setButtonLoading(el.btnSaveUpdate, true);

  try {
    await api.createUpdateRequest({ title, description });
    el.updateForm.reset();
    await loadUpdateRequests();
    showToast('Pedido enviado', 'success');
  } catch (err) {
    el.updateError.textContent = err.message;
    showToast(err.message, 'error');
  } finally {
    setButtonLoading(el.btnSaveUpdate, false);
  }
});

function playFadeIn(element) {
  element.classList.remove('fade-in');
  void element.offsetWidth;
  element.classList.add('fade-in');
}

const VIEWS = {
  calendar: () => el.viewCalendar,
  settings: () => el.viewSettings,
  activity: () => el.viewActivity,
  updates: () => el.viewUpdates,
  gallery: () => el.viewGallery,
  invites: () => el.viewInvites,
};

function switchView(view) {
  el.navItems.forEach((item) => item.classList.toggle('is-active', item.dataset.view === view));
  Object.entries(VIEWS).forEach(([key, getEl]) => getEl().classList.toggle('hidden', key !== view));
  playFadeIn(VIEWS[view]());
  el.filterBar.classList.toggle('hidden', view !== 'calendar');

  if (view === 'activity') loadActivityLog();
  if (view === 'updates') loadUpdateRequests();
  if (view === 'gallery') renderGallery();
  if (view === 'invites') reloadInvitations().catch((err) => showToast(err.message, 'error'));
}

el.navItems.forEach((item) => {
  item.addEventListener('click', () => {
    switchView(item.dataset.view);
    if (isMobile()) setMobileSidebarOpen(false);
  });
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

function setMobileSidebarOpen(open) {
  el.sidebar.classList.toggle('is-mobile-open', open);
  el.sidebarBackdrop.classList.toggle('is-visible', open);
}

el.btnToggleSidebar.addEventListener('click', () => {
  if (isMobile()) {
    setMobileSidebarOpen(!el.sidebar.classList.contains('is-mobile-open'));
  } else {
    setSidebarCollapsed(!el.sidebar.classList.contains('is-collapsed'));
  }
});

el.sidebarBackdrop.addEventListener('click', () => setMobileSidebarOpen(false));

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
  const sharedIds = sharedEventIdSet();

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
        .map((event) => {
          const bg = event.creator ? personColorFor(event.creator._id) : 'var(--color-primary)';
          const recurringIcon = event.recurring ? iconHtml('repeat', 'icon-inline') : '';
          const sharedIcon = sharedIds.has(event._id) ? iconHtml('heart', 'icon-inline shared-badge-icon') : '';
          return `<span class="event-pill" style="background:${bg}">${sharedIcon}${recurringIcon}${escapeHtml(event.title)}</span>`;
        })
        .join('');
      const more = dayEvents.length > 3 ? `<span class="badge">+${dayEvents.length - 3} mais</span>` : '';

      const thumbs = dayImages
        .slice(0, 3)
        .map((att) => `<img class="calendar-day-thumb" src="${fileUrl(att.url)}" alt="${escapeHtml(att.name)}" />`)
        .join('');

      return `
        <button type="button" class="calendar-day${isToday ? ' is-today' : ''}" data-date="${dateKey}">
          <div class="calendar-day-header">
            <span class="calendar-day-number">${date.getDate()}</span>
            ${hasOtherAttachment ? `<span class="calendar-day-attachment-badge">${iconHtml('paperclip')}</span>` : ''}
          </div>
          <div class="calendar-day-events">${pills}${more}</div>
          ${thumbs ? `<div class="calendar-day-thumbs">${thumbs}</div>` : ''}
        </button>
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

/* ---------- Lista de meses (mobile) ---------- */

const isMobile = () => window.matchMedia('(max-width: 768px)').matches;

function generateMonthRange() {
  const base = new Date();
  const months = [];
  for (let i = -6; i <= 12; i += 1) {
    months.push(new Date(base.getFullYear(), base.getMonth() + i, 1));
  }
  return months;
}

function countEventsInMonth(monthDate) {
  return buildMonthCells(monthDate)
    .filter(Boolean)
    .reduce((sum, day) => sum + eventsByDateKey(toDateKey(day)).length, 0);
}

function renderMonthList() {
  const today = new Date();

  el.monthListContainer.innerHTML = generateMonthRange()
    .map((monthDate) => {
      const rawLabel = monthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      const label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
      const count = countEventsInMonth(monthDate);
      const isCurrent =
        monthDate.getFullYear() === today.getFullYear() && monthDate.getMonth() === today.getMonth();

      return `
        <button type="button" class="calendar-month-item${isCurrent ? ' is-current' : ''}"
             data-year="${monthDate.getFullYear()}" data-month="${monthDate.getMonth()}">
          <span>${label}</span>
          ${count > 0 ? `<span class="calendar-month-badge">${count}</span>` : ''}
        </button>
      `;
    })
    .join('');

  el.monthListContainer.querySelectorAll('.calendar-month-item').forEach((item) => {
    item.addEventListener('click', () => {
      state.viewDate = new Date(Number(item.dataset.year), Number(item.dataset.month), 1);
      renderCalendar();
      showMobileGridView();
    });
  });
}

function showMobileGridView() {
  el.viewCalendar.classList.remove('mobile-list-active');
}

function showMobileMonthList() {
  el.viewCalendar.classList.add('mobile-list-active');
  renderMonthList();
}

el.btnBackToMonths.addEventListener('click', showMobileMonthList);

window.matchMedia('(max-width: 768px)').addEventListener('change', (event) => {
  if (event.matches) {
    showMobileMonthList();
  } else {
    el.viewCalendar.classList.remove('mobile-list-active');
    setMobileSidebarOpen(false);
  }
});

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
  if (mimetype === 'application/pdf') return iconHtml('file');
  return iconHtml('paperclip');
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

/* ---------- Galeria ---------- */

function allEventPhotos() {
  return state.events.flatMap((event) =>
    (event.attachments || [])
      .filter((att) => IMAGE_MIME.test(att.mimetype))
      .map((att) => ({
        url: att.url,
        name: att.name,
        eventId: event._id,
        eventTitle: event.title,
        date: event.date,
      }))
  );
}

function photoMonthKey(dateStr) {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function photoMonthLabel(monthKey) {
  const [y, m] = monthKey.split('-').map(Number);
  const label = new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function galleryPhotosForMonth(monthKey) {
  const photos = allEventPhotos();
  if (!monthKey) return photos;
  return photos.filter((photo) => photoMonthKey(photo.date) === monthKey);
}

function renderGalleryMonthStrip() {
  const photos = allEventPhotos();
  const counts = new Map();
  photos.forEach((photo) => {
    const key = photoMonthKey(photo.date);
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  const months = [...counts.keys()].sort().reverse();

  if (months.length === 0) {
    el.galleryMonthStrip.innerHTML = '';
    return;
  }

  const allChip = `
    <button type="button" class="gallery-month-chip${state.galleryMonthKey === null ? ' is-active' : ''}" data-month="">
      Todos <span class="gallery-month-chip-count">${photos.length}</span>
    </button>
  `;
  const monthChips = months
    .map(
      (key) => `
        <button type="button" class="gallery-month-chip${state.galleryMonthKey === key ? ' is-active' : ''}" data-month="${key}">
          ${escapeHtml(photoMonthLabel(key))} <span class="gallery-month-chip-count">${counts.get(key)}</span>
        </button>
      `
    )
    .join('');

  el.galleryMonthStrip.innerHTML = allChip + monthChips;

  el.galleryMonthStrip.querySelectorAll('[data-month]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.galleryMonthKey = btn.dataset.month || null;
      renderGalleryMonthStrip();
      renderGalleryGrid();
    });
  });
}

function renderGalleryGrid() {
  const photos = galleryPhotosForMonth(state.galleryMonthKey);

  if (photos.length === 0) {
    el.galleryGrid.innerHTML = '<p class="sidebar-empty">Nenhuma foto neste período.</p>';
    return;
  }

  el.galleryGrid.innerHTML = photos
    .map(
      (photo, index) => `
        <button type="button" class="gallery-thumb" data-index="${index}">
          <img src="${fileUrl(photo.url)}" alt="${escapeHtml(photo.name)}" loading="lazy" />
        </button>
      `
    )
    .join('');

  el.galleryGrid.querySelectorAll('[data-index]').forEach((btn) => {
    btn.addEventListener('click', () => openLightbox(photos, Number(btn.dataset.index)));
  });
}

function renderGallery() {
  const photos = allEventPhotos();
  const currentMonthKey = photoMonthKey(new Date());
  const hasCurrentMonth = photos.some((photo) => photoMonthKey(photo.date) === currentMonthKey);
  const mostRecentMonthKey = photos.length
    ? [...new Set(photos.map((photo) => photoMonthKey(photo.date)))].sort().reverse()[0]
    : null;

  state.galleryMonthKey = hasCurrentMonth ? currentMonthKey : mostRecentMonthKey;

  renderGalleryMonthStrip();
  renderGalleryGrid();
}

function openLightbox(photos, index) {
  state.galleryPhotos = photos;
  state.lightboxIndex = index;
  showLightboxPhoto();
  el.lightboxOverlay.classList.add('is-open');
}

function showLightboxPhoto() {
  const photo = state.galleryPhotos[state.lightboxIndex];
  if (!photo) return;
  el.lightboxImage.src = fileUrl(photo.url);
  el.lightboxImage.alt = photo.name || '';
  const dateLabel = new Date(photo.date).toLocaleDateString('pt-BR');
  el.lightboxCaption.textContent = `${photo.eventTitle} · ${dateLabel}`;
}

function showLightboxOffset(offset) {
  const total = state.galleryPhotos.length;
  if (total === 0) return;
  state.lightboxIndex = (state.lightboxIndex + offset + total) % total;
  showLightboxPhoto();
}

function closeLightbox() {
  el.lightboxOverlay.classList.remove('is-open');
}

function renderEventList(dateKey) {
  const dayEvents = eventsByDateKey(dateKey);

  if (dayEvents.length === 0) {
    el.eventList.innerHTML = '<p>Nenhum evento neste dia ainda.</p>';
    return;
  }

  const sharedIds = sharedEventIdSet();

  el.eventList.innerHTML = dayEvents
    .map((event) => {
      const dotColor = event.creator ? personColorFor(event.creator._id) : 'var(--color-text-muted)';
      const recurringIcon = event.recurring ? iconHtml('repeat', 'icon-inline') : '';
      const sharedIcon = sharedIds.has(event._id) ? iconHtml('heart', 'icon-inline shared-badge-icon') : '';
      return `
        <div class="event-list-item-wrap" data-id="${event._id}">
          <div class="event-list-item">
            <div>
              <strong>${sharedIcon}${recurringIcon}${escapeHtml(event.title)}</strong><br />
              <span class="badge"><span class="person-dot" style="background:${dotColor}"></span>por ${escapeHtml(event.creator?.name || 'desconhecido')}</span>
            </div>
            <button type="button" class="btn btn-secondary" data-edit="${event._id}">Editar</button>
          </div>
          ${renderAttachmentList(event.attachments)}
        </div>
      `;
    })
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
        <span class="attachment-file">${attachmentIcon(file.type) || iconHtml('paperclip')}</span>
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
    el.eventDate.value = toDateKey(new Date(event.date));
    el.eventTitle.value = event.title;
    el.eventDescription.value = event.description || '';
    el.eventRecurrence.value = event.recurring ? 'yearly' : event.hideWhenPast ? 'once' : 'none';
    el.btnDeleteEvent.classList.remove('hidden');
  } else {
    state.editingEventId = null;
    state.existingAttachments = [];
    el.eventId.value = '';
    el.eventDate.value = dateKey;
    el.eventTitle.value = '';
    el.eventDescription.value = '';
    el.eventRecurrence.value = 'none';
    el.btnDeleteEvent.classList.add('hidden');
  }

  renderFormAttachmentsPreview();
  renderEventInviteSection(event);
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
  if (isMobile()) renderMonthList();
  if (!el.viewGallery.classList.contains('hidden')) renderGallery();
}

async function reloadInvitations() {
  state.invitations = await api.getInvitations();
  renderInviteBoard();
  renderCalendar();
  renderUpcomingEvents();
  if (!el.eventForm.classList.contains('hidden') && state.editingEventId) {
    renderEventInviteSection(state.events.find((e) => e._id === state.editingEventId));
  }
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
      recurring: el.eventRecurrence.value === 'yearly',
      hideWhenPast: el.eventRecurrence.value === 'once',
    };

    const wasEditing = Boolean(state.editingEventId);

    if (wasEditing) {
      await api.updateEvent(state.editingEventId, payload);
    } else {
      await api.createEvent(payload);
    }

    await reloadEvents();
    openDayModal(state.selectedDateKey || dateKey);
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
    await reloadEvents();
    openDayModal(state.selectedDateKey);
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

el.lightboxClose.addEventListener('click', closeLightbox);
el.lightboxPrev.addEventListener('click', () => showLightboxOffset(-1));
el.lightboxNext.addEventListener('click', () => showLightboxOffset(1));
el.lightboxOverlay.addEventListener('click', (event) => {
  if (event.target === el.lightboxOverlay) closeLightbox();
});

document.addEventListener('keydown', (event) => {
  if (el.lightboxOverlay.classList.contains('is-open')) {
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft') showLightboxOffset(-1);
    if (event.key === 'ArrowRight') showLightboxOffset(1);
    return;
  }
  if (event.key === 'Escape' && el.modalOverlay.classList.contains('is-open')) closeModal();
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

  const themeIconUse = el.btnTheme.querySelector('use');
  if (themeIconUse) {
    themeIconUse.setAttribute('href', `../assets/icons.svg#icon-${theme === 'dark' ? 'sun' : 'moon'}`);
  }
}

function applyColorTheme(colorTheme) {
  document.documentElement.setAttribute('data-color-theme', colorTheme);
  el.colorSwatchGrid.querySelectorAll('.color-swatch').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.colorTheme === colorTheme);
  });
}

el.colorSwatchGrid.querySelectorAll('.color-swatch').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const colorTheme = btn.dataset.colorTheme;
    applyColorTheme(colorTheme);

    try {
      await api.updateSettings({ colorTheme });
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
});

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
    applyColorTheme(settings.colorTheme || 'indigo');
    el.settingsBackground.value = settings.background || '';
  } catch (err) {
    console.error('Não foi possível carregar as configurações:', err.message);
  }

  try {
    state.users = await api.getUsers();
    populateCreatorFilter();
    if (user) el.userAvatar.style.background = personColorFor(user._id);
  } catch (err) {
    console.error('Não foi possível carregar os usuários:', err.message);
  }

  try {
    await reloadEvents();
    if (isMobile()) showMobileMonthList();
  } catch (err) {
    if (err.message.includes('Token')) {
      api.logout();
      window.location.href = 'login.html';
    }
  }

  try {
    await reloadInvitations();
  } catch (err) {
    console.error('Não foi possível carregar os convites:', err.message);
  }
}

init();
