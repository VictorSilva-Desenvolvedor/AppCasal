import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, test, expect } from 'vitest';
import { EMOTIONS, EMOTION_CATEGORY_LABELS, EMOTION_CATEGORY_ORDER } from './emotions.js';

// A lista de emoções vive em 2 lugares que não se importam entre si (o backend
// é CommonJS e valida por enum do Mongoose; o frontend é ESM e carrega
// label/emoji/cor). Sem este teste, adicionar uma emoção em só um lado passa
// batido e só aparece como erro genérico de validação na hora de salvar.
const MODEL_PATH = fileURLToPath(new URL('../../../backend/src/models/EmotionEntry.js', import.meta.url));

function backendEmotionKeys() {
  const source = readFileSync(MODEL_PATH, 'utf8');
  const block = source.match(/const EMOTIONS = \[([\s\S]*?)\];/);
  if (!block) throw new Error('Não encontrei o array EMOTIONS em EmotionEntry.js');
  return block[1].match(/'([a-z_]+)'/g).map((quoted) => quoted.slice(1, -1));
}

describe('paridade de emoções entre frontend e backend', () => {
  test('as chaves sao exatamente as mesmas nos dois lados', () => {
    expect(backendEmotionKeys().sort()).toEqual(Object.keys(EMOTIONS).sort());
  });

  test('o enum do backend nao tem chaves repetidas', () => {
    const keys = backendEmotionKeys();
    expect(keys).toHaveLength(new Set(keys).size);
  });

  test('saudade e eros estao registradas nos dois lados', () => {
    expect(backendEmotionKeys()).toEqual(expect.arrayContaining(['saudade', 'eros']));
    expect(EMOTIONS.saudade.category).toBe('neutra');
    expect(EMOTIONS.eros.category).toBe('positiva');
  });
});

describe('metadados das emoções', () => {
  test('toda emocao tem label, emoji, cor hex e categoria conhecida', () => {
    Object.entries(EMOTIONS).forEach(([key, meta]) => {
      expect(meta.label, key).toBeTruthy();
      expect(meta.emoji, key).toBeTruthy();
      expect(meta.color, key).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(EMOTION_CATEGORY_ORDER, key).toContain(meta.category);
    });
  });

  test('toda categoria da ordem tem rotulo e ao menos uma emocao', () => {
    EMOTION_CATEGORY_ORDER.forEach((category) => {
      expect(EMOTION_CATEGORY_LABELS[category], category).toBeTruthy();
      expect(Object.values(EMOTIONS).some((meta) => meta.category === category), category).toBe(true);
    });
  });
});
