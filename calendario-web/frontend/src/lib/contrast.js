// Texto legível sobre uma cor de fundo arbitrária (emoções, cores de pessoa).
// Várias dessas cores são claras (#FFC93C, #ec4899, #d97706...): branco fixo em
// cima delas dava ~1,7:1 a ~3,5:1, abaixo do mínimo de 4,5:1 — o limiar abaixo
// é o ponto em que escuro passa a contrastar melhor que branco.
const READABLE_LUMINANCE_THRESHOLD = 0.185;

export function readableTextOn(hexColor) {
  if (!hexColor || !hexColor.startsWith('#') || hexColor.length !== 7) return '#fff';
  const channels = [1, 3, 5].map((i) => {
    const c = parseInt(hexColor.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  return luminance > READABLE_LUMINANCE_THRESHOLD ? '#111' : '#fff';
}
