const TaskItem = require('../../../src/models/TaskItem');
const User = require('../../../src/models/User');
const { resetTaskItems, ensureTaskItemsReset } = require('../../../src/services/taskItemResetService');
const db = require('../../helpers/db');

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

// Fake apenas o Date — se useFakeTimers() faker tambem setTimeout/setInterval,
// os timers internos do driver do MongoDB (heartbeat, socket timeout) ficam
// presos e todo await contra o banco trava ate estourar o timeout do teste.
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

async function seedItems(lastResetKey) {
  const user = await User.create({ name: 'Vitor', password: 'senha123' });
  const kinds = ['diaria', 'semanal', 'mensal', 'unica'];
  for (const kind of kinds) {
    await TaskItem.create({
      title: `Tarefa ${kind}`,
      kind,
      belongsTo: user._id,
      createdBy: user._id,
      completed: true,
      completedAt: new Date(),
      lastResetKey,
    });
  }
}

describe('resetTaskItems', () => {
  test('numa segunda-feira que tambem e dia 1, reseta diaria, semanal e mensal', async () => {
    mockDate('2026-06-01T12:00:00.000Z'); // segunda-feira, dia 1
    await seedItems('2026-05-31');

    const result = await resetTaskItems();
    expect(result).toEqual({ diaria: 1, semanal: 1, mensal: 1 });

    const refreshed = await TaskItem.find();
    for (const item of refreshed) {
      if (item.kind === 'unica') {
        expect(item.completed).toBe(true); // 'unica' nunca reseta sozinha
      } else {
        expect(item.completed).toBe(false);
        expect(item.completedAt).toBeNull();
        expect(item.lastResetKey).toBe('2026-06-01');
      }
    }
  });

  test('numa terca-feira que e dia 15, so reseta a diaria', async () => {
    mockDate('2026-09-15T12:00:00.000Z'); // terca-feira, dia 15
    await seedItems('2026-09-14');

    const result = await resetTaskItems();
    expect(result).toEqual({ diaria: 1, semanal: 0, mensal: 0 });

    const semanal = await TaskItem.findOne({ kind: 'semanal' });
    const mensal = await TaskItem.findOne({ kind: 'mensal' });
    expect(semanal.completed).toBe(true);
    expect(mensal.completed).toBe(true);
  });

  test('e idempotente: nao reseta de novo um item ja resetado hoje', async () => {
    mockDate('2026-06-01T12:00:00.000Z');
    await seedItems('2026-06-01'); // ja resetado hoje

    const result = await resetTaskItems();
    expect(result).toEqual({ diaria: 0, semanal: 0, mensal: 0 });

    const diaria = await TaskItem.findOne({ kind: 'diaria' });
    expect(diaria.completed).toBe(true); // nao foi tocado de novo
  });

  test('faz catch-up do ciclo perdido: semanal atrasada reseta numa quarta-feira', async () => {
    mockDate('2026-09-16T12:00:00.000Z'); // quarta-feira
    await seedItems('2026-09-02'); // duas semanas atras — o cron da segunda nao rodou

    const result = await resetTaskItems();
    expect(result).toEqual({ diaria: 1, semanal: 1, mensal: 0 });

    const semanal = await TaskItem.findOne({ kind: 'semanal' });
    expect(semanal.completed).toBe(false);
    expect(semanal.lastResetKey).toBe('2026-09-16');
  });

  test('item sem lastResetKey so e carimbado, nunca desmarcado', async () => {
    mockDate('2026-09-15T12:00:00.000Z');
    await seedItems(null); // criado e concluido hoje, antes do primeiro reset

    const result = await resetTaskItems();
    expect(result).toEqual({ diaria: 0, semanal: 0, mensal: 0 });

    const diaria = await TaskItem.findOne({ kind: 'diaria' });
    expect(diaria.completed).toBe(true); // conclusao legitima preservada
    expect(diaria.lastResetKey).toBe('2026-09-15'); // baseline pro reset de amanha

    const unica = await TaskItem.findOne({ kind: 'unica' });
    expect(unica.lastResetKey).toBeNull(); // 'unica' fica de fora ate do carimbo
  });
});

describe('ensureTaskItemsReset', () => {
  test('roda uma vez por dia por processo: a segunda chamada nao toca no banco', async () => {
    mockDate('2026-07-08T12:00:00.000Z');
    await seedItems('2026-07-07');

    expect(await ensureTaskItemsReset()).toEqual({ diaria: 1, semanal: 0, mensal: 0 });
    expect(await ensureTaskItemsReset()).toBeNull();
  });
});
