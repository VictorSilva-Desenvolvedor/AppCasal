import { describe, test, expect } from 'vitest';
import { groupByKind, groupByPeriod, countCompleted, ringGeometry, canManageItem } from './tarefasUtils.js';

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

  test('joga os concluidos para o fim do grupo', () => {
    const items = [
      { kind: 'diaria', title: 'A', completed: true },
      { kind: 'diaria', title: 'B', completed: false },
      { kind: 'diaria', title: 'C', completed: true },
      { kind: 'diaria', title: 'D', completed: false },
    ];
    expect(groupByKind(items).diaria.map((i) => i.title)).toEqual(['B', 'D', 'A', 'C']);
  });

  test('preserva a ordem original dentro de cada metade', () => {
    const items = [
      { kind: 'semanal', title: 'primeiro', completed: false },
      { kind: 'semanal', title: 'segundo', completed: false },
      { kind: 'semanal', title: 'terceiro', completed: false },
    ];
    expect(groupByKind(items).semanal.map((i) => i.title)).toEqual(['primeiro', 'segundo', 'terceiro']);
  });
});

describe('groupByPeriod', () => {
  test('separa as diarias nos quatro periodos do dia', () => {
    const items = [
      { period: 'manha', title: 'escovar os dentes' },
      { period: 'manha', title: 'levar marmita' },
      { period: 'tarde', title: 'lavar vasilha' },
    ];
    const groups = groupByPeriod(items);
    expect(groups.manha.map((i) => i.title)).toEqual(['escovar os dentes', 'levar marmita']);
    expect(groups.tarde).toHaveLength(1);
    expect(groups.noite).toHaveLength(0);
    expect(groups['dia-todo']).toHaveLength(0);
  });

  test('item sem periodo cai em dia-todo (compatibilidade com o que ja existia)', () => {
    const groups = groupByPeriod([{ title: 'antiga' }, { period: undefined, title: 'outra' }]);
    expect(groups['dia-todo']).toHaveLength(2);
  });

  test('periodo desconhecido tambem cai em dia-todo em vez de sumir', () => {
    const groups = groupByPeriod([{ period: 'madrugada', title: 'X' }]);
    expect(groups['dia-todo']).toHaveLength(1);
    expect(Object.values(groups).flat()).toHaveLength(1);
  });

  test('preserva a ordem que veio do groupByKind (pendentes primeiro)', () => {
    const diarias = groupByKind([
      { kind: 'diaria', period: 'manha', title: 'feita', completed: true },
      { kind: 'diaria', period: 'manha', title: 'pendente', completed: false },
    ]).diaria;
    expect(groupByPeriod(diarias).manha.map((i) => i.title)).toEqual(['pendente', 'feita']);
  });
});

describe('canManageItem', () => {
  const dono = 'user-dono';
  const criador = 'user-criador';

  function item({ completed = false } = {}) {
    return { belongsTo: { _id: dono }, createdBy: { _id: criador }, completed };
  }

  test('o dono da lista sempre pode, concluida ou nao', () => {
    expect(canManageItem(item(), dono)).toBe(true);
    expect(canManageItem(item({ completed: true }), dono)).toBe(true);
  });

  test('quem so adicionou pode enquanto nao esta concluida', () => {
    expect(canManageItem(item(), criador)).toBe(true);
    expect(canManageItem(item({ completed: true }), criador)).toBe(false);
  });

  test('terceiro nunca pode', () => {
    expect(canManageItem(item(), 'outro')).toBe(false);
  });

  test('aceita ids nao populados', () => {
    const cru = { belongsTo: dono, createdBy: criador, completed: false };
    expect(canManageItem(cru, dono)).toBe(true);
    expect(canManageItem(cru, 'outro')).toBe(false);
  });

  test('sem item ou sem usuario retorna false em vez de explodir', () => {
    expect(canManageItem(null, dono)).toBe(false);
    expect(canManageItem(item(), undefined)).toBe(false);
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
