import { describe, test, expect, vi, afterEach } from 'vitest';
import {
  formatDuration,
  scaleForElapsed,
  candyWeightTier,
  groupEntriesByDay,
  formatCandyCount,
  formatDayLabel,
} from './candyUtils.js';
import { CANDY_MIN_SCALE, CANDY_MAX_SCALE, MAX_HOLD_MS } from './candyConfig.js';

describe('formatDuration', () => {
  test('mostra segundos inteiros sem casa decimal', () => {
    expect(formatDuration(3000)).toBe('3s');
  });

  test('mostra uma casa decimal para valores nao inteiros', () => {
    expect(formatDuration(3500)).toBe('3.5s');
  });
});

describe('scaleForElapsed', () => {
  test('clampa em CANDY_MIN_SCALE para valores negativos', () => {
    expect(scaleForElapsed(-500)).toBe(CANDY_MIN_SCALE);
  });

  test('clampa em CANDY_MAX_SCALE para valores acima de MAX_HOLD_MS', () => {
    expect(scaleForElapsed(MAX_HOLD_MS + 10000)).toBe(CANDY_MAX_SCALE);
  });

  test('interpola linearmente entre os dois extremos', () => {
    expect(scaleForElapsed(MAX_HOLD_MS / 2)).toBeCloseTo((CANDY_MIN_SCALE + CANDY_MAX_SCALE) / 2);
  });
});

describe('candyWeightTier', () => {
  test('primeiro terco retorna o tier leve', () => {
    expect(candyWeightTier(MAX_HOLD_MS * 0.1).bg).toBeDefined();
  });

  test('terco do meio e o do fim usam cores diferentes', () => {
    const medium = candyWeightTier(MAX_HOLD_MS * 0.5);
    const heavy = candyWeightTier(MAX_HOLD_MS * 0.95);
    expect(medium.bg).not.toBe(heavy.bg);
  });
});

describe('groupEntriesByDay', () => {
  test('agrupa por dia e ordena do mais recente para o mais antigo', () => {
    const entries = [
      { day: '2026-07-01', id: 1 },
      { day: '2026-07-03', id: 2 },
      { day: '2026-07-01', id: 3 },
    ];
    const grouped = groupEntriesByDay(entries);
    expect(grouped.map((g) => g.day)).toEqual(['2026-07-03', '2026-07-01']);
    expect(grouped.find((g) => g.day === '2026-07-01').entries).toHaveLength(2);
  });
});

describe('formatCandyCount', () => {
  test('usa singular para 1 doce', () => {
    expect(formatCandyCount(1)).toBe('1 doce');
  });

  test('usa plural para 0 ou mais de 1 doce', () => {
    expect(formatCandyCount(0)).toBe('0 doces');
    expect(formatCandyCount(3)).toBe('3 doces');
  });
});

describe('formatDayLabel', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test('retorna "Hoje" quando dayKey e a data atual', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 20, 15, 0, 0));
    expect(formatDayLabel('2026-07-20')).toBe('Hoje');
  });

  test('retorna "Ontem" quando dayKey e o dia anterior', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 20, 15, 0, 0));
    expect(formatDayLabel('2026-07-19')).toBe('Ontem');
  });

  test('retorna a data por extenso para dias mais antigos', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 20, 15, 0, 0));
    expect(formatDayLabel('2026-06-15')).toBe('15 de junho de 2026');
  });
});
