// Mantido em sincronia manual com backend/src/utils/candyLimits.js (MAX_HOLD_MS),
// já que não há código compartilhado entre backend e frontend neste repo.
export const MAX_HOLD_MS = 20000; // 20s

// Escala do doce: 1x (tamanho original) a t=0 até 2x aos 20s — +25% a cada 5s.
export const CANDY_MIN_SCALE = 1;
export const CANDY_MAX_SCALE = 2;

// Inclinação máxima da trave da balança (lado mais pesado desce), em graus.
export const MAX_BEAM_TILT_DEG = 12;
