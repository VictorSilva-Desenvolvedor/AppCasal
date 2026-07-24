import {
  CANDY_COLOR_HEAVY_FROM,
  CANDY_COLOR_HEAVY_TO,
  CANDY_COLOR_LIGHT,
  CANDY_COLOR_MEDIUM,
  CANDY_MAX_SCALE,
  CANDY_MIN_SCALE,
  MAX_HOLD_MS,
} from './candyConfig.js';

const CANDY_COLOR_STOPS = [
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

// Verde -> âmbar -> coral/vermelho conforme o doce cresce, em 3 estágios de
// tamanho igual. Cores fixas (identidade própria da feature, ver
// candyConfig.js) — não usam mais var(--color-success)/--color-danger, que
// mudam por tema; aqui a paleta é sempre a mesma independente do tema do app.
export function candyColorMix(scale) {
  const range = CANDY_MAX_SCALE - CANDY_MIN_SCALE;
  const t = range ? Math.min(Math.max((scale - CANDY_MIN_SCALE) / range, 0), 1) : 0;

  for (let i = 0; i < CANDY_COLOR_STOPS.length - 1; i++) {
    const from = CANDY_COLOR_STOPS[i];
    const to = CANDY_COLOR_STOPS[i + 1];
    if (t <= to.t || i === CANDY_COLOR_STOPS.length - 2) {
      const span = to.t - from.t || 1;
      const pct = Math.min(Math.max(((t - from.t) / span) * 100, 0), 100);
      return `color-mix(in oklch, ${from.color} ${100 - pct}%, ${to.color} ${pct}%)`;
    }
  }
  return CANDY_COLOR_STOPS[CANDY_COLOR_STOPS.length - 1].color;
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

export function initialsOf(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}
