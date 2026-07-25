import { describe, test, expect } from 'vitest';
import { groupByKind, countCompleted, ringGeometry } from './tarefasUtils.js';

describe('groupByKind', () => {
  test('agrupa itens pelo campo kind', () => {
    const items = [
      { kind: 'diaria', title: 'A' },
      { kind: 'unica', title: 'B' },
      { kind: 'diaria', title: 'C' },
    ];
    const groups = groupByKind(items);
    expect(groups.diaria).toHaveLength(2);
    expect(groups.unica).toHaveLength(1);
    expect(groups.semanal).toHaveLength(0);
    expect(groups.mensal).toHaveLength(0);
  });

  test('ignora silenciosamente itens com kind desconhecido', () => {
    const items = [{ kind: 'inexistente', title: 'A' }];
    const groups = groupByKind(items);
    expect(Object.values(groups).flat()).toHaveLength(0);
  });
});

describe('countCompleted', () => {
  test('conta itens concluidos e o total', () => {
    const items = [{ completed: true }, { completed: false }, { completed: true }];
    expect(countCompleted(items)).toEqual({ done: 2, total: 3 });
  });

  test('lida com lista vazia', () => {
    expect(countCompleted([])).toEqual({ done: 0, total: 0 });
  });
});

describe('ringGeometry', () => {
  test('total 0 nao produz NaN, retorna pct 0', () => {
    const { pct } = ringGeometry(0, 0);
    expect(pct).toBe(0);
    expect(Number.isNaN(pct)).toBe(false);
  });

  test('done igual a total retorna 100%', () => {
    const { pct } = ringGeometry(4, 4);
    expect(pct).toBe(100);
  });

  test('calcula a circunferencia e o offset do SVG a partir do raio', () => {
    const { circumference, offset } = ringGeometry(1, 2, 10);
    expect(circumference).toBeCloseTo(2 * Math.PI * 10);
    expect(offset).toBeCloseTo(circumference / 2);
  });
});
