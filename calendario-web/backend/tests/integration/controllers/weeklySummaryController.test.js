const request = require('supertest');
const app = require('../../../src/app');
const User = require('../../../src/models/User');
const Habit = require('../../../src/models/Habit');
const HabitCheckin = require('../../../src/models/HabitCheckin');
const FinanceEntry = require('../../../src/models/FinanceEntry');
const EmotionEntry = require('../../../src/models/EmotionEntry');
const TaskItem = require('../../../src/models/TaskItem');
const CandyEntry = require('../../../src/models/CandyEntry');
const db = require('../../helpers/db');
const { tokenFor } = require('../../helpers/authToken');

// Fake apenas o Date — ver o mesmo raciocinio em taskItemResetService.test.js:
// faker setTimeout/setInterval junto travaria os timers internos do driver
// do MongoDB.
function mockDate(iso) {
  jest.useFakeTimers({
    doNotFake: [
      'setTimeout',
      'clearTimeout',
      'setInterval',
      'clearInterval',
      'setImmediate',
      'clearImmediate',
      'queueMicrotask',
      'nextTick',
      'hrtime',
      'performance',
    ],
  }).setSystemTime(new Date(iso));
}

beforeAll(async () => {
  await db.connect();
});

afterEach(async () => {
  await db.clearDatabase();
  jest.useRealTimers();
});

afterAll(async () => {
  await db.closeDatabase();
});

async function seedTeamData(team, { habitCheckinDays, financeAmounts, emotionIntensity, taskCompletedAt, candyDurationMs }) {
  const me = await User.create({ name: `Vitor-${team}`, password: 'senha123', team });
  const partner = await User.create({ name: `Maria-${team}`, password: 'senha123', team });

  const habit = await Habit.create({
    name: 'Beber água',
    type: 'individual',
    owner: me._id,
    createdBy: me._id,
    team,
  });
  for (const day of habitCheckinDays) {
    await HabitCheckin.create({ habit: habit._id, user: me._id, day, team });
  }

  await FinanceEntry.create({
    type: 'receita',
    description: 'Salário',
    amount: financeAmounts.receita,
    date: new Date('2026-07-10T12:00:00.000Z'),
    paidBy: me._id,
    creator: me._id,
    team,
  });
  await FinanceEntry.create({
    type: 'despesa',
    description: 'Mercado',
    amount: financeAmounts.despesa,
    date: new Date('2026-07-12T12:00:00.000Z'),
    paidBy: me._id,
    creator: me._id,
    team,
  });

  await EmotionEntry.create({
    day: '2026-07-20',
    period: 'noite',
    emotion: 'feliz',
    intensity: emotionIntensity,
    user: me._id,
    team,
  });

  await TaskItem.create({
    title: 'Lavar louça',
    kind: 'unica',
    belongsTo: me._id,
    createdBy: me._id,
    completed: true,
    completedAt: taskCompletedAt,
    team,
  });

  await CandyEntry.create({ user: me._id, durationMs: candyDurationMs, day: '2026-07-21', team });

  return { me, partner };
}

describe('GET /api/weekly-summary', () => {
  test('agrega dados da semana corrente, isolados por equipe', async () => {
    mockDate('2026-07-25T15:00:00.000Z'); // sabado, dentro da semana 19-25/07

    const { me } = await seedTeamData('principal', {
      habitCheckinDays: ['2026-07-19', '2026-07-20'],
      financeAmounts: { receita: 1000, despesa: 400 },
      emotionIntensity: 4,
      taskCompletedAt: new Date('2026-07-21T12:00:00.000Z'),
      candyDurationMs: 5000,
    });

    // Dados de outra equipe — não podem vazar para a resposta da equipe 'principal'.
    await seedTeamData('outro', {
      habitCheckinDays: ['2026-07-19', '2026-07-20', '2026-07-21'],
      financeAmounts: { receita: 9999, despesa: 9999 },
      emotionIntensity: 1,
      taskCompletedAt: new Date('2026-07-21T12:00:00.000Z'),
      candyDurationMs: 1000,
    });

    const res = await request(app).get('/api/weekly-summary').set('Authorization', `Bearer ${tokenFor(me)}`);

    expect(res.status).toBe(200);
    expect(res.body.weekStart).toBe('2026-07-19');
    expect(res.body.weekEnd).toBe('2026-07-25');

    expect(res.body.habits.totalActive).toBe(1);
    expect(res.body.habits.items[0].completedDaysThisWeek).toBe(2);

    expect(res.body.finance.status).toBe('aberto');
    expect(res.body.finance.totalReceitas).toBe(1000);
    expect(res.body.finance.totalDespesas).toBe(400);
    expect(res.body.finance.saldo).toBe(600);

    expect(res.body.emotions.count).toBe(1);
    expect(res.body.emotions.averageIntensity).toBe(4);

    expect(res.body.tasks.completedThisWeek).toBe(1);

    expect(res.body.candy.ranking).toHaveLength(2); // roster inteiro da equipe 'principal'
    const totalCandyMs = res.body.candy.ranking.reduce((sum, row) => sum + row.totalMs, 0);
    expect(totalCandyMs).toBe(5000);
  });

  test('retorna 401 sem token', async () => {
    const res = await request(app).get('/api/weekly-summary');
    expect(res.status).toBe(401);
  });
});
