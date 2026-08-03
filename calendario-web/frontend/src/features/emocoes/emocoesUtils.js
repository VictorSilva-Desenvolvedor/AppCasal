import { EMOTIONS } from '../../constants/emotions.js';

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

// Desempate explícito: contagem, depois soma de intensidade, depois ordem
// alfabética. Antes o empate era resolvido pela ordem de inserção do Map, então
// o mesmo dia podia mostrar "emoção predominante" diferente dependendo da ordem
// em que os registros voltavam da API.
export function predominantEmotion(entries) {
  if (!entries.length) return null;

  const stats = new Map();
  entries.forEach((entry) => {
    const current = stats.get(entry.emotion) || { count: 0, intensity: 0 };
    stats.set(entry.emotion, { count: current.count + 1, intensity: current.intensity + entry.intensity });
  });

  return [...stats.entries()].sort(
    ([keyA, a], [keyB, b]) => b.count - a.count || b.intensity - a.intensity || keyA.localeCompare(keyB)
  )[0][0];
}

// Alternativa textual da jarra: as bolhas são só <span> coloridos, então sem
// isto um leitor de tela não tem nada pra anunciar no elemento mais importante
// da tela. Ordena por contagem e depois por rótulo, pra leitura ser estável.
export function describeJar(entries) {
  if (!entries.length) return 'Jarra vazia, nenhum registro hoje';

  const counts = new Map();
  entries.forEach((entry) => counts.set(entry.emotion, (counts.get(entry.emotion) || 0) + 1));

  const parts = [...counts.entries()]
    .map(([key, count]) => ({ count, label: EMOTIONS[key]?.label || key }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .map(({ count, label }) => `${count} de ${label}`);

  const total = `${entries.length} ${entries.length === 1 ? 'registro' : 'registros'} de hoje`;
  return `Jarra com ${total}: ${parts.join(', ')}`;
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

export function formatEntryTime(date) {
  if (!date) return '';
  return new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
