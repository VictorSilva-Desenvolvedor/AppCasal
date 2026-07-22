export const PERIODS = ['manha', 'tarde', 'noite'];
export const PERIOD_LABELS = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite' };
export const PERIOD_ICONS = { manha: 'sunrise', tarde: 'sun', noite: 'moon' };
export const PERIOD_QUESTIONS = {
  manha: 'Como você está se sentindo nesta manhã?',
  tarde: 'Como foi sua tarde emocionalmente?',
  noite: 'Como você termina o dia?',
};

export function toDayKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 00:00–11:59 manhã · 12:00–17:59 tarde · 18:00–23:59 noite
export function currentPeriod(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return 'manha';
  if (h < 18) return 'tarde';
  return 'noite';
}

export function groupEntriesByPeriod(entries) {
  const grouped = { manha: [], tarde: [], noite: [] };
  entries.forEach((entry) => grouped[entry.period]?.push(entry));
  return grouped;
}

export function groupEntriesByDay(entries) {
  const map = new Map();
  entries.forEach((entry) => {
    if (!map.has(entry.day)) map.set(entry.day, []);
    map.get(entry.day).push(entry);
  });
  return Array.from(map.entries())
    .map(([day, dayEntries]) => ({ day, entries: dayEntries }))
    .sort((a, b) => (a.day < b.day ? 1 : -1));
}

export function predominantEmotion(entries) {
  if (!entries.length) return null;
  const counts = new Map();
  entries.forEach((entry) => counts.set(entry.emotion, (counts.get(entry.emotion) || 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

export function mostIntenseEntry(entries) {
  if (!entries.length) return null;
  return [...entries].sort((a, b) => b.intensity - a.intensity)[0];
}

// Constrói a partir dos componentes de data (não Date.parse('YYYY-MM-DD'), que
// é interpretado como UTC e viraria o dia anterior em fusos negativos como UTC-3).
export function formatDayLabel(dayKey) {
  const [y, m, d] = dayKey.split('-').map(Number);
  return new Date(y, m - 1, d, 12).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}
