// Mantido em sincronia manual com backend/src/utils/candyLimits.js (MAX_HOLD_MS),
// já que não há código compartilhado entre backend e frontend neste repo.
export const MAX_HOLD_MS = 20000; // 20s

// Escala do doce: 1x (tamanho original) a t=0 até 2x aos 20s — +25% a cada 5s.
export const CANDY_MIN_SCALE = 1;
export const CANDY_MAX_SCALE = 2;

// Inclinação máxima da trave da balança (lado mais pesado desce), em graus.
export const MAX_BEAM_TILT_DEG = 12;

// Identidade visual própria da feature — fixa, não reage aos ~15 temas de
// cor do app (tokens.css). Espelhada em styles/doces.css (.candy-page), que
// é onde essas mesmas cores viram custom properties pro CSS puro.
export const CANDY_BRAND = '#D4537E';
export const CANDY_ON_BRAND = '#ffffff'; // não reaproveitar --color-on-primary: aquele é calibrado por tema pro primary daquele tema, sem relação com este rosa fixo

export const CANDY_COLOR_LIGHT = '#5DCAA5';
export const CANDY_COLOR_LIGHT_TEXT = '#085041';
export const CANDY_COLOR_MEDIUM = '#EF9F27';
export const CANDY_COLOR_MEDIUM_TEXT = '#633806';
export const CANDY_COLOR_HEAVY_FROM = '#F0997B';
export const CANDY_COLOR_HEAVY_TO = '#E24B4A';
export const CANDY_COLOR_HEAVY_TEXT = '#4A1B0C';
