import { describe, test, expect } from 'vitest';
import { normalizeRule, getOccurrencesInRange, getNextOccurrence } from './recurrence.js';

function keys(dates) {
  return dates.map((dt) => {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
}

describe('normalizeRule', () => {
  test('migra recurring:true sem rule para anual', () => {
    expect(normalizeRule({ recurring: true })).toEqual({
      frequency: 'yearly',
      interval: 1,
      daysOfWeek: [],
      endDate: null,
      endCount: null,
    });
  });

  test('clampa interval invalido (0) para 1', () => {
    expect(normalizeRule({ recurrenceRule: { frequency: 'daily', interval: 0 } }).interval).toBe(1);
  });
});

describe('getOccurrencesInRange', () => {
  test('daily com interval 2', () => {
    const rule = { frequency: 'daily', interval: 2, daysOfWeek: [], endDate: null, endCount: null };
    const occurrences = getOccurrencesInRange(new Date(2026, 0, 1), rule, new Date(2026, 0, 1), new Date(2026, 0, 10));
    expect(keys(occurrences)).toEqual(['2026-01-01', '2026-01-03', '2026-01-05', '2026-01-07', '2026-01-09']);
  });

  test('monthly clampa dia 31 para o ultimo dia de fevereiro', () => {
    const rule = { frequency: 'monthly', interval: 1, daysOfWeek: [], endDate: null, endCount: null };
    const occurrences = getOccurrencesInRange(new Date(2026, 0, 31), rule, new Date(2026, 1, 1), new Date(2026, 1, 28));
    expect(keys(occurrences)).toEqual(['2026-02-28']);
  });

  test('respeita endCount mesmo com range maior', () => {
    const rule = { frequency: 'daily', interval: 1, daysOfWeek: [], endDate: null, endCount: 3 };
    const occurrences = getOccurrencesInRange(new Date(2026, 0, 1), rule, new Date(2026, 0, 1), new Date(2026, 0, 31));
    expect(occurrences).toHaveLength(3);
  });
});

describe('getNextOccurrence', () => {
  test('retorna null quando nao ha ocorrencia futura (frequency none)', () => {
    const rule = { frequency: 'none', interval: 1, daysOfWeek: [], endDate: null, endCount: null };
    expect(getNextOccurrence(new Date(2020, 0, 1), rule, new Date(2026, 0, 1))).toBeNull();
  });
});

describe('aritmetica em horario LOCAL (diferente da versao backend, que usa UTC)', () => {
  test('ocorrencias sao ancoradas ao meio-dia local, nao a meia-noite UTC', () => {
    const rule = { frequency: 'daily', interval: 1, daysOfWeek: [], endDate: null, endCount: null };
    const [occurrence] = getOccurrencesInRange(new Date(2026, 0, 1), rule, new Date(2026, 0, 1), new Date(2026, 0, 1));

    // backend/src/utils/recurrence.js usa Date.UTC e ancora a meia-noite UTC
    // (getUTCHours()===0); esta versao usa componentes locais e ancora ao
    // meio-dia local — resultado independente do fuso horario da maquina.
    expect(occurrence.getHours()).toBe(12);
    expect(occurrence.getFullYear()).toBe(2026);
    expect(occurrence.getMonth()).toBe(0);
    expect(occurrence.getDate()).toBe(1);
  });
});
