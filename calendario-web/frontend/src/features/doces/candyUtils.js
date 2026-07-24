import {
  CANDY_COLOR_HEAVY_FROM,
  CANDY_COLOR_HEAVY_TO,
  CANDY_COLOR_LIGHT,
  CANDY_COLOR_MEDIUM,
  CANDY_MAX_SCALE,
  CANDY_MIN_SCALE,
  MAX_HOLD_MS,
} from './candyConfig.js';

const CANDY_WEIGHT_COLOR_STOPS = [
  { t: 0, color: CANDY_COLOR_LIGHT },
  { t: 1 / 3, color: CANDY_COLOR_MEDIUM },
  { t: 2 / 3, color: CANDY_COLOR_HEAVY_FROM },
  { t: 1, color: CANDY_COLOR_HEAVY_TO },
];

export function formatDuration(ms) {
  const seconds = ms / 1000;
  return `${Number.isInteger(seconds) ? seconds : seconds.toFixed(1)}s`;
}

export function scaleForElapsed(elapsedMs) {
  const ratio = Math.min(Math.max(elapsedMs, 0), MAX_HOLD_MS) / MAX_HOLD_MS;
  return CANDY_MIN_SCALE + ratio * (CANDY_MAX_SCALE - CANDY_MIN_SCALE);
}

// Tingido pela cor de identidade da pessoa (baseColor, ver personColorFor em
// calendarUtils.js): claro no início do "segurar", cor cheia na metade da
// escala, escurecido no máximo — mesmo doce comunica de quem é E quão pesado
// foi o deslize, em vez de uma escala verde/âmbar/vermelho universal.
const CANDY_TINT_LIGHT_MAX = 65; // % de branco no início do "segurar" (t=0)
const CANDY_TINT_DARK_MAX = 25; // % de preto no fim do "segurar" (t=1)

export function candyColorMix(scale, baseColor) {
  const range = CANDY_MAX_SCALE - CANDY_MIN_SCALE;
  const t = range ? Math.min(Math.max((scale - CANDY_MIN_SCALE) / range, 0), 1) : 0;

  if (t <= 0.5) {
    const whitePct = CANDY_TINT_LIGHT_MAX * (1 - t / 0.5);
    return `color-mix(in oklch, white ${whitePct}%, ${baseColor})`;
  }
  const blackPct = CANDY_TINT_DARK_MAX * ((t - 0.5) / 0.5);
  return `color-mix(in oklch, black ${blackPct}%, ${baseColor})`;
}

// Verde -> âmbar -> coral/vermelho conforme o doce cresce, em 3 estágios de
// tamanho igual. Escala universal (não depende de quem registrou) — usada no
// Ranking e no Histórico, onde o nome já aparece do lado de cada doce.
export function candyWeightColor(scale) {
  const range = CANDY_MAX_SCALE - CANDY_MIN_SCALE;
  const t = range ? Math.min(Math.max((scale - CANDY_MIN_SCALE) / range, 0), 1) : 0;

  for (let i = 0; i < CANDY_WEIGHT_COLOR_STOPS.length - 1; i++) {
    const from = CANDY_WEIGHT_COLOR_STOPS[i];
    const to = CANDY_WEIGHT_COLOR_STOPS[i + 1];
    if (t <= to.t || i === CANDY_WEIGHT_COLOR_STOPS.length - 2) {
      const span = to.t - from.t || 1;
      const pct = Math.min(Math.max(((t - from.t) / span) * 100, 0), 100);
      return `color-mix(in oklch, ${from.color} ${100 - pct}%, ${to.color} ${pct}%)`;
    }
  }
  return CANDY_WEIGHT_COLOR_STOPS[CANDY_WEIGHT_COLOR_STOPS.length - 1].color;
}

// Balde 1-5 a partir da duração, pro formato que useEmotionJarPhysics já
// espera (radiusForIntensity(intensity) = 5 + intensity*3).
export function intensityForDuration(durationMs) {
  const ratio = Math.min(Math.max(durationMs, 0), MAX_HOLD_MS) / MAX_HOLD_MS;
  return 1 + Math.min(4, Math.floor(ratio * 5));
}

// Placar simples pra quem não conhece a mecânica interna (segundos de segurar
// viram "pontos" arredondados) — usado nos rótulos comparativos da balança e
// do ranking. formatDuration continua servindo pro cronômetro ao vivo e pro
// histórico, onde mostrar a duração real faz sentido.
export function formatScore(totalMs) {
  return `${Math.round(totalMs / 1000)} pontos`;
}

// Contagem de registros do período, com concordância pt-BR — usada só no
// Ranking (a fileira de docinhos já mostra o peso; aqui é só a quantidade).
export function formatCandyCount(count) {
  return `${count} ${count === 1 ? 'doce' : 'doces'}`;
}

export function formatEntryTime(date) {
  return new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function toDayKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// "Hoje"/"Ontem" ou a data por extenso — construída a partir dos componentes
// da chave (não Date.parse('YYYY-MM-DD'), que é interpretado como UTC e vira
// o dia anterior em fusos negativos como UTC-3).
export function formatDayLabel(dayKey) {
  if (dayKey === toDayKey(new Date())) return 'Hoje';
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dayKey === toDayKey(yesterday)) return 'Ontem';

  const [y, m, d] = dayKey.split('-').map(Number);
  return new Date(y, m - 1, d, 12).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
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

export function initialsOf(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}
