import { API_BASE_URL } from '../../services/api.js';
import { getOccurrencesInRange, normalizeRule } from '../../lib/recurrence.js';
import { compareDateOnly, dateOnlyKey, localDateKey, parseDateOnly } from '../../lib/dateOnly.js';
import { CATEGORIES } from '../../constants/categories.js';
import { readableTextOn } from '../../lib/contrast.js';

export { compareDateOnly, dateOnlyKey, formatDateOnly, parseDateOnly } from '../../lib/dateOnly.js';

export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, '');
export const IMAGE_MIME = /^image\//;
export const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Espelha --color-person-1..6 de styles/tokens.css (mesmas cores nos 9 temas e
// no modo escuro). O hex fica aqui porque o cálculo de contraste do texto sobre
// o avatar precisa do valor real, que a var() do CSS não entrega ao JS.
export const PERSON_COLOR_HEX = ['#2563eb', '#ec4899', '#16a34a', '#d97706', '#7c3aed', '#0d9488'];

export const PERSON_COLORS = PERSON_COLOR_HEX.map((_, i) => `var(--color-person-${i + 1})`);

export const SPECIAL_CATEGORY_ICONS = {
  aniversario: '/icon-aniversario.png',
  saude: '/icon-consulta.png',
};

export const EVENT_COLORS = [
  '#2563eb',
  '#9333ea',
  '#16a34a',
  '#f97316',
  '#dc2626',
  '#0891b2',
  '#ca8a04',
  '#db2777',
];

export const EVENT_COLOR_LABELS = {
  '#2563eb': 'Azul',
  '#9333ea': 'Roxo',
  '#16a34a': 'Verde',
  '#f97316': 'Laranja',
  '#dc2626': 'Vermelho',
  '#0891b2': 'Ciano',
  '#ca8a04': 'Amarelo',
  '#db2777': 'Rosa',
};

// Rótulo acessível da célula de dia: sozinho, o número do dia não diz nada num
// leitor de tela ("12" em vez de "12 de agosto, 2 eventos").
export function dayCellAriaLabel(date, eventCount) {
  const dateLabel = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  if (eventCount === 0) return `${dateLabel}, sem eventos`;
  if (eventCount === 1) return `${dateLabel}, 1 evento`;
  return `${dateLabel}, ${eventCount} eventos`;
}

// Data já construída no fuso local (célula do grid, `new Date()`) -> chave.
// Para valor vindo da API use `dateOnlyKey`.
export function toDateKey(date) {
  return localDateKey(date);
}

// Grava ao meio-dia UTC: assim a data lida de volta com componentes UTC
// (`parseDateOnly`) é sempre o mesmo dia, em qualquer fuso do usuário.
export function dateKeyToNoonISO(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).toISOString();
}

export function fileUrl(path) {
  if (!path) return '';
  return path.startsWith('http') ? path : `${API_ORIGIN}${path}`;
}

export function isEventRecurring(event) {
  return normalizeRule(event).frequency !== 'none';
}

export function matchesSearchTerm(event, term) {
  const haystack = `${event.title} ${event.description || ''}`.toLowerCase();
  return haystack.includes(term.toLowerCase());
}

export function matchesFilters(event, filters) {
  const { search, creatorId, category, onlyWithAttachment } = filters;
  if (creatorId && event.creator?._id !== creatorId) return false;
  if (category && event.category !== category) return false;
  if (onlyWithAttachment && (!event.attachments || event.attachments.length === 0)) return false;
  if (search && !matchesSearchTerm(event, search)) return false;
  return true;
}

export function isHiddenPastEvent(event) {
  if (isEventRecurring(event) || !event.hideWhenPast) return false;
  return dateOnlyKey(event.date) < toDateKey(new Date());
}

export function filteredEvents(events, filters) {
  return events.filter((event) => matchesFilters(event, filters)).filter((event) => !isHiddenPastEvent(event));
}

// Expande as ocorrências de cada evento dentro do intervalo [rangeStart, rangeEnd]
// e agrupa por dateKey, para não recalcular a recorrência por célula do grid.
export function buildOccurrenceMap(events, rangeStart, rangeEnd) {
  const map = new Map();

  events.forEach((event) => {
    getOccurrencesInRange(parseDateOnly(event.date), normalizeRule(event), rangeStart, rangeEnd).forEach((occurrence) => {
      const key = toDateKey(occurrence);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(event);
    });
  });

  return map;
}

export function matchesDateKey(event, dateKey) {
  if (!dateKey) return false;
  const [y, m, d] = dateKey.split('-').map(Number);
  const target = new Date(y, m - 1, d, 12, 0, 0);
  return getOccurrencesInRange(parseDateOnly(event.date), normalizeRule(event), target, target).length > 0;
}

export function nextOccurrenceDate(event) {
  const today = new Date();
  const horizon = new Date(today.getFullYear() + 5, today.getMonth(), today.getDate());
  const occurrences = getOccurrencesInRange(parseDateOnly(event.date), normalizeRule(event), today, horizon);
  return occurrences[0] || parseDateOnly(event.date);
}

export function eventsByDateKey(events, filters, dateKey) {
  return filteredEvents(events, filters)
    .filter((event) => matchesDateKey(event, dateKey))
    .sort((a, b) => compareDateOnly(a.date, b.date));
}

function personColorIndex(users, userId) {
  const index = users.findIndex((user) => user._id === userId);
  return (index === -1 ? 0 : index) % PERSON_COLORS.length;
}

export function personColorFor(users, userId) {
  return PERSON_COLORS[personColorIndex(users, userId)];
}

// Cor de texto legível sobre personColorFor(...) — cada cor de pessoa exige um
// contraste próprio (4 das 6 pedem texto escuro), então texto branco fixo não serve.
export function personTextColorFor(users, userId) {
  return readableTextOn(PERSON_COLOR_HEX[personColorIndex(users, userId)]);
}

export function pillColorFor(event, users) {
  if (event.color) return event.color;
  if (event.category && CATEGORIES[event.category]) return CATEGORIES[event.category].color;
  return event.creator ? personColorFor(users, event.creator._id) : 'var(--color-primary)';
}

// Par de pillColorFor: o fundo do pill varia por evento/categoria/pessoa, então
// a cor do texto tem que ser calculada junto (--color-on-primary só é calibrado
// pro --color-primary do tema).
export function pillTextColorFor(event, users) {
  if (event.color) return readableTextOn(event.color);
  if (event.category && CATEGORIES[event.category]) return readableTextOn(CATEGORIES[event.category].color);
  return event.creator ? personTextColorFor(users, event.creator._id) : 'var(--color-on-primary)';
}

export function specialCategoryIconSrc(event) {
  return SPECIAL_CATEGORY_ICONS[event.category] || null;
}

// Selo(s) que "vestem" a célula do dia quando ela tem algum evento de categoria
// especial (aniversário/saúde) — não fica preso a um pill específico.
export function dayIconBadgeSrcs(dayEvents) {
  return [...new Set(dayEvents.map((event) => SPECIAL_CATEGORY_ICONS[event.category]).filter(Boolean))];
}

export function hasImportantDate(dayEvents) {
  return dayEvents.some((event) => event.category === 'aniversario');
}

export function sharedEventIdSet(invitations) {
  return new Set(
    invitations
      .filter((inv) => inv.status === 'accepted')
      .map((inv) => inv.event?._id)
      .filter(Boolean),
  );
}

export function attachmentIconName(mimetype) {
  if (IMAGE_MIME.test(mimetype)) return null;
  if (mimetype === 'application/pdf') return 'file';
  return 'paperclip';
}

export function generateMonthRange() {
  const base = new Date();
  const months = [];
  for (let i = -6; i <= 12; i += 1) {
    months.push(new Date(base.getFullYear(), base.getMonth() + i, 1));
  }
  return months;
}

export function countEventsInMonth(monthDate, occMap) {
  return buildMonthCells(monthDate)
    .filter(Boolean)
    .reduce((sum, day) => sum + (occMap.get(toDateKey(day))?.length || 0), 0);
}

export function buildMonthCells(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];

  for (let i = 0; i < firstDay.getDay(); i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(new Date(year, month, d));

  return cells;
}

// ---------- Lembretes: estado de formulário <-> array da API ----------

export const DEFAULT_REMINDER_OFFSETS = [5, 3, 1];

export function reminderOffsetsToString(offsets) {
  return (offsets?.length ? offsets : DEFAULT_REMINDER_OFFSETS).join(', ');
}

export function parseReminderOffsets(text) {
  const parsed = text
    .split(',')
    .map((part) => parseInt(part.trim(), 10))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 90);
  return parsed.length ? parsed : DEFAULT_REMINDER_OFFSETS;
}

// ---------- Recorrência: estado de formulário <-> regra da API ----------

export function initialRecurrenceState(event) {
  const rule = event
    ? normalizeRule(event)
    : { frequency: 'none', interval: 1, daysOfWeek: [], endDate: null, endCount: null };

  let endType = 'never';
  let endDateKey = '';
  let endCount = 5;

  if (rule.endDate) {
    endType = 'date';
    endDateKey = toDateKey(rule.endDate);
  } else if (rule.endCount) {
    endType = 'count';
    endCount = rule.endCount;
  }

  return {
    frequency: rule.frequency,
    interval: rule.interval || 1,
    daysOfWeek: rule.daysOfWeek,
    endType,
    endDate: endDateKey,
    endCount,
  };
}

export function recurrenceStateToRule(value) {
  const { frequency, interval, daysOfWeek, endType, endDate, endCount } = value;

  if (frequency === 'none') {
    return { frequency: 'none', interval: 1, daysOfWeek: [], endDate: null, endCount: null };
  }

  return {
    frequency,
    interval: Math.max(1, interval || 1),
    daysOfWeek: frequency === 'weekly' ? daysOfWeek : [],
    endDate: endType === 'date' && endDate ? dateKeyToNoonISO(endDate) : null,
    endCount: endType === 'count' ? Math.max(1, endCount || 1) : null,
  };
}
