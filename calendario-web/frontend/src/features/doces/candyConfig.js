// Mantido em sincronia manual com backend/src/utils/candyLimits.js (MAX_HOLD_MS),
// já que não há código compartilhado entre backend e frontend neste repo.
export const MAX_HOLD_MS = 20000; // 20s

// Escala do doce: 1x (tamanho original) a t=0 até 2x aos 20s — +25% a cada 5s.
export const CANDY_MIN_SCALE = 1;
export const CANDY_MAX_SCALE = 2;

// Inclinação máxima da trave da balança (lado mais pesado desce), em graus.
export const MAX_BEAM_TILT_DEG = 12;

// O rosa de identidade da feature vive só em styles/doces.css (.candy-page,
// --candy-brand): nada em JS precisa dele, e manter uma segunda cópia aqui só
// criava duas fontes de verdade pra mesma cor.

// Escala universal de peso (verde/âmbar/vermelho) — usada no Ranking e no
// Histórico (onde o nome da pessoa já aparece do lado, então a cor foca em
// comunicar o peso do registro). Independente da cor tingida por pessoa usada
// na balança/botão "Segurar" (ver candyColorMix em candyUtils.js).
export const CANDY_COLOR_LIGHT = '#5DCAA5';
export const CANDY_COLOR_LIGHT_TEXT = '#085041';
export const CANDY_COLOR_MEDIUM = '#EF9F27';
export const CANDY_COLOR_MEDIUM_TEXT = '#633806';
export const CANDY_COLOR_HEAVY_FROM = '#F0997B';
export const CANDY_COLOR_HEAVY_TO = '#E24B4A';
export const CANDY_COLOR_HEAVY_TEXT = '#2A0A03'; // escuro o bastante pra passar 4.5:1 sobre CANDY_COLOR_HEAVY_TO no chip do histórico
