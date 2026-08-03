import { describe, test, expect } from 'vitest';
import {
  currentPeriod,
  describeJar,
  formatDayLabel,
  groupEntriesByDay,
  mostIntenseEntry,
  predominantEmotion,
} from './emocoesUtils.js';

function entry(emotion, intensity = 3, day = '2026-08-03') {
  return { _id: `${emotion}-${intensity}-${Math.random()}`, emotion, intensity, day };
}

describe('currentPeriod', () => {
  test('vira tarde exatamente ao meio-dia', () => {
    expect(currentPeriod(new Date(2026, 7, 3, 11, 59))).toBe('manha');
    expect(currentPeriod(new Date(2026, 7, 3, 12, 0))).toBe('tarde');
  });

  test('vira noite exatamente as 18h', () => {
    expect(currentPeriod(new Date(2026, 7, 3, 17, 59))).toBe('tarde');
    expect(currentPeriod(new Date(2026, 7, 3, 18, 0))).toBe('noite');
  });

  test('a madrugada conta como manha', () => {
    expect(currentPeriod(new Date(2026, 7, 3, 0, 0))).toBe('manha');
  });
});

describe('predominantEmotion', () => {
  test('devolve null para lista vazia', () => {
    expect(predominantEmotion([])).toBeNull();
  });

  test('devolve a emocao mais frequente', () => {
    expect(predominantEmotion([entry('feliz'), entry('triste'), entry('feliz')])).toBe('feliz');
  });

  test('empate na contagem e desfeito pela soma de intensidade', () => {
    expect(predominantEmotion([entry('feliz', 2), entry('triste', 5)])).toBe('triste');
  });

  test('empate total e desfeito pela ordem alfabetica, nao pela ordem da lista', () => {
    const ordem = [entry('triste', 3), entry('feliz', 3)];
    const inversa = [entry('feliz', 3), entry('triste', 3)];
    expect(predominantEmotion(ordem)).toBe(predominantEmotion(inversa));
    expect(predominantEmotion(ordem)).toBe('feliz');
  });
});

describe('describeJar', () => {
  test('descreve jarra vazia', () => {
    expect(describeJar([])).toBe('Jarra vazia, nenhum registro hoje');
  });

  test('usa singular com um unico registro', () => {
    expect(describeJar([entry('feliz')])).toBe('Jarra com 1 registro de hoje: 1 de Feliz');
  });

  test('agrupa por emocao e ordena pela contagem', () => {
    expect(describeJar([entry('ansioso'), entry('feliz'), entry('feliz')])).toBe(
      'Jarra com 3 registros de hoje: 2 de Feliz, 1 de Ansioso'
    );
  });

  test('inclui as emocoes novas com o rotulo correto', () => {
    expect(describeJar([entry('saudade'), entry('eros')])).toBe('Jarra com 2 registros de hoje: 1 de Eros, 1 de Saudade');
  });
});

describe('mostIntenseEntry', () => {
  test('devolve null para lista vazia', () => {
    expect(mostIntenseEntry([])).toBeNull();
  });

  test('devolve o registro de maior intensidade', () => {
    expect(mostIntenseEntry([entry('feliz', 2), entry('triste', 5), entry('calmo', 4)]).emotion).toBe('triste');
  });
});

describe('groupEntriesByDay', () => {
  test('agrupa e ordena do dia mais recente para o mais antigo', () => {
    const days = groupEntriesByDay([
      entry('feliz', 3, '2026-08-01'),
      entry('triste', 3, '2026-08-03'),
      entry('calmo', 3, '2026-08-01'),
    ]);
    expect(days.map((d) => d.day)).toEqual(['2026-08-03', '2026-08-01']);
    expect(days[1].entries).toHaveLength(2);
  });
});

describe('formatDayLabel', () => {
  test('nao volta um dia em fuso negativo (regressao do Date.parse UTC)', () => {
    expect(formatDayLabel('2026-08-03')).toContain('03');
    expect(formatDayLabel('2026-01-01')).toContain('01');
  });
});
