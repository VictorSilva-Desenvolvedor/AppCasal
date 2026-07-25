const { isPeriodComplete, groupUsersByTeam } = require('../../../src/services/habitStreakService');

function baseHabit(overrides = {}) {
  return {
    type: 'casal',
    goalType: 'binario',
    targetValue: 0,
    owner: null,
    subtasks: [],
    freezeDays: [],
    ...overrides,
  };
}

describe('isPeriodComplete', () => {
  test('congelamento (freeze) sempre vence, mesmo sem checkins', () => {
    const habit = baseHabit({ freezeDays: [{ day: '2026-07-20' }] });
    expect(isPeriodComplete(habit, '2026-07-20', [], [{ _id: 'u1' }, { _id: 'u2' }])).toBe(true);
  });

  describe('habito colaborativo', () => {
    test('incompleto quando falta checkin de uma subtask ativa', () => {
      const habit = baseHabit({
        type: 'colaborativo',
        subtasks: [{ _id: 'a', active: true }, { _id: 'b', active: true }],
      });
      expect(isPeriodComplete(habit, '2026-07-20', [{ subtask: 'a' }], [])).toBe(false);
    });

    test('completo quando todas as subtasks ativas tem checkin', () => {
      const habit = baseHabit({
        type: 'colaborativo',
        subtasks: [{ _id: 'a', active: true }, { _id: 'b', active: true }],
      });
      const checkins = [{ subtask: 'a' }, { subtask: 'b' }];
      expect(isPeriodComplete(habit, '2026-07-20', checkins, [])).toBe(true);
    });

    test('incompleto quando nao ha subtasks ativas', () => {
      const habit = baseHabit({ type: 'colaborativo', subtasks: [{ _id: 'a', active: false }] });
      expect(isPeriodComplete(habit, '2026-07-20', [], [])).toBe(false);
    });
  });

  describe('habito alternado', () => {
    test('completo com qualquer checkin no dia', () => {
      const habit = baseHabit({ type: 'alternado' });
      expect(isPeriodComplete(habit, '2026-07-20', [{ user: 'u1' }], [])).toBe(true);
    });

    test('incompleto sem checkin no dia', () => {
      const habit = baseHabit({ type: 'alternado' });
      expect(isPeriodComplete(habit, '2026-07-20', [], [])).toBe(false);
    });
  });

  describe('habito individual quantitativo', () => {
    test('completo quando a soma dos valores atinge a meta', () => {
      const habit = baseHabit({ type: 'individual', owner: 'u1', goalType: 'quantitativo', targetValue: 10 });
      const checkins = [{ user: 'u1', value: 6 }, { user: 'u1', value: 5 }];
      expect(isPeriodComplete(habit, '2026-07-20', checkins, [])).toBe(true);
    });

    test('incompleto quando a soma fica abaixo da meta', () => {
      const habit = baseHabit({ type: 'individual', owner: 'u1', goalType: 'quantitativo', targetValue: 10 });
      const checkins = [{ user: 'u1', value: 4 }];
      expect(isPeriodComplete(habit, '2026-07-20', checkins, [])).toBe(false);
    });
  });

  describe('habito casal (binario)', () => {
    test('completo somente quando todos os usuarios tem checkin', () => {
      const habit = baseHabit({ type: 'casal' });
      const users = [{ _id: 'u1' }, { _id: 'u2' }];
      const checkins = [{ user: 'u1' }, { user: 'u2' }];
      expect(isPeriodComplete(habit, '2026-07-20', checkins, users)).toBe(true);
    });

    test('incompleto quando falta checkin de um dos usuarios', () => {
      const habit = baseHabit({ type: 'casal' });
      const users = [{ _id: 'u1' }, { _id: 'u2' }];
      const checkins = [{ user: 'u1' }];
      expect(isPeriodComplete(habit, '2026-07-20', checkins, users)).toBe(false);
    });
  });
});

describe('groupUsersByTeam', () => {
  test('agrupa usuarios por equipe', () => {
    const users = [
      { _id: 'u1', team: 'principal' },
      { _id: 'u2', team: 'principal' },
      { _id: 'u3', team: 'teste' },
    ];
    const grouped = groupUsersByTeam(users);
    expect(grouped.get('principal')).toHaveLength(2);
    expect(grouped.get('teste')).toHaveLength(1);
  });

  test('retorna mapa vazio para lista de usuarios vazia', () => {
    expect(groupUsersByTeam([]).size).toBe(0);
  });
});
