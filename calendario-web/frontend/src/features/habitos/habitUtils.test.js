import { describe, expect, it } from 'vitest';
import { displayStreak } from './habitUtils.js';

const me = { _id: 'u1', name: 'Eu' };
const today = new Date(2026, 9, 15, 12);

function individualHabit(overrides = {}) {
  return { _id: 'h1', type: 'individual', owner: me._id, currentStreak: 0, lastEvaluatedDay: null, ...overrides };
}

describe('displayStreak', () => {
  it('conta o check-in de hoje num hábito criado hoje (nunca avaliado pelo cron)', () => {
    const checkins = [{ habit: 'h1', user: me._id, day: '2026-10-15' }];
    expect(displayStreak(individualHabit(), checkins, [me], today)).toBe(1);
  });

  it('soma hoje à sequência quando a última avaliação foi ontem', () => {
    const habit = individualHabit({ currentStreak: 4, lastEvaluatedDay: '2026-10-14' });
    const checkins = [{ habit: 'h1', user: me._id, day: '2026-10-15' }];
    expect(displayStreak(habit, checkins, [me], today)).toBe(5);
  });

  it('não soma hoje sem check-in', () => {
    expect(displayStreak(individualHabit({ currentStreak: 2, lastEvaluatedDay: '2026-10-14' }), [], [me], today)).toBe(2);
  });

  it('não conta hoje duas vezes quando o cron já avaliou hoje', () => {
    const habit = individualHabit({ currentStreak: 3, lastEvaluatedDay: '2026-10-15' });
    const checkins = [{ habit: 'h1', user: me._id, day: '2026-10-15' }];
    expect(displayStreak(habit, checkins, [me], today)).toBe(3);
  });
});
