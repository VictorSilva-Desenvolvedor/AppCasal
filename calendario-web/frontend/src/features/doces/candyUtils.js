import { CANDY_MAX_SCALE, CANDY_MIN_SCALE, MAX_HOLD_MS } from './candyConfig.js';

export function formatDuration(ms) {
  const seconds = ms / 1000;
  return `${Number.isInteger(seconds) ? seconds : seconds.toFixed(1)}s`;
}

export function scaleForElapsed(elapsedMs) {
  const ratio = Math.min(Math.max(elapsedMs, 0), MAX_HOLD_MS) / MAX_HOLD_MS;
  return CANDY_MIN_SCALE + ratio * (CANDY_MAX_SCALE - CANDY_MIN_SCALE);
}

// Verde -> amarelo -> vermelho conforme o doce cresce. Usa color-mix contra as
// variáveis de tema (--color-success/--color-danger) em vez de hex fixos, pra
// não sair de sincronia quando o tema claro/escuro/colorido muda essas cores
// (mesmo idioma já usado em useEmotionJarPhysics/EmotionJar.jsx).
export function candyColorMix(scale) {
  const range = CANDY_MAX_SCALE - CANDY_MIN_SCALE;
  const t = range ? Math.min(Math.max((scale - CANDY_MIN_SCALE) / range, 0), 1) : 0;

  if (t <= 0.5) {
    const pct = (t / 0.5) * 100;
    return `color-mix(in oklch, var(--color-success) ${100 - pct}%, #eab308 ${pct}%)`;
  }
  const pct = ((t - 0.5) / 0.5) * 100;
  return `color-mix(in oklch, #eab308 ${100 - pct}%, var(--color-danger) ${pct}%)`;
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
