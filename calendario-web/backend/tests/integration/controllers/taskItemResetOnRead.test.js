const request = require('supertest');
const app = require('../../../src/app');
const User = require('../../../src/models/User');
const TaskItem = require('../../../src/models/TaskItem');
const db = require('../../helpers/db');
const { tokenFor } = require('../../helpers/authToken');
const { todayKeyInTimezone, addDaysToKey } = require('../../../src/utils/dayKey');

// Arquivo separado de propósito: o guard em memória do ensureTaskItemsReset é
// por processo, e o Jest dá um registry de módulos limpo por arquivo de teste.
// Aqui o GET abaixo é a primeira leitura do processo, que é exatamente o
// cenário que interessa — alguém abrindo a tela depois da virada do dia.

let me;
let meToken;

beforeAll(async () => {
  await db.connect();
});

beforeEach(async () => {
  me = await User.create({ name: 'Vitor', password: 'senha123', team: 'principal' });
  meToken = tokenFor(me);
});

afterEach(async () => {
  await db.clearDatabase();
});

afterAll(async () => {
  await db.closeDatabase();
});

describe('GET /api/task-items', () => {
  test('zera as diarias de ontem na primeira leitura do dia, sem depender do cron', async () => {
    const ontem = addDaysToKey(todayKeyInTimezone(), -1);
    await TaskItem.create({
      title: 'Concluida ontem',
      kind: 'diaria',
      belongsTo: me._id,
      createdBy: me._id,
      completed: true,
      completedAt: new Date(),
      lastResetKey: ontem,
      team: 'principal',
    });
    await TaskItem.create({
      title: 'Tarefa unica concluida',
      kind: 'unica',
      belongsTo: me._id,
      createdBy: me._id,
      completed: true,
      completedAt: new Date(),
      lastResetKey: ontem,
      team: 'principal',
    });

    const res = await request(app).get('/api/task-items').set('Authorization', `Bearer ${meToken}`);

    expect(res.status).toBe(200);
    const diaria = res.body.find((item) => item.kind === 'diaria');
    const unica = res.body.find((item) => item.kind === 'unica');
    expect(diaria.completed).toBe(false);
    expect(diaria.completedAt).toBeNull();
    expect(unica.completed).toBe(true); // 'unica' nunca reseta sozinha
  });
});
