const request = require('supertest');
const app = require('../../../src/app');
const User = require('../../../src/models/User');
const TaskItem = require('../../../src/models/TaskItem');
const db = require('../../helpers/db');
const { tokenFor } = require('../../helpers/authToken');

let me;
let partner;
let meToken;
let partnerToken;

beforeAll(async () => {
  await db.connect();
});

beforeEach(async () => {
  me = await User.create({ name: 'Vitor', password: 'senha123', team: 'principal' });
  partner = await User.create({ name: 'Maria', password: 'senha123', team: 'principal' });
  meToken = tokenFor(me);
  partnerToken = tokenFor(partner);
});

afterEach(async () => {
  await db.clearDatabase();
});

afterAll(async () => {
  await db.closeDatabase();
});

describe('POST /api/task-items', () => {
  test('cria uma tarefa na propria lista', async () => {
    const res = await request(app)
      .post('/api/task-items')
      .set('Authorization', `Bearer ${meToken}`)
      .send({ title: 'Lavar louça', kind: 'diaria', belongsTo: me._id.toString() });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Lavar louça');
    expect(res.body.completed).toBe(false);
  });

  test('guarda o periodo do dia numa diaria', async () => {
    const res = await request(app)
      .post('/api/task-items')
      .set('Authorization', `Bearer ${meToken}`)
      .send({ title: 'Escovar os dentes', kind: 'diaria', period: 'manha', belongsTo: me._id.toString() });

    expect(res.status).toBe(201);
    expect(res.body.period).toBe('manha');
  });

  test('diaria sem periodo informado cai em dia-todo', async () => {
    const res = await request(app)
      .post('/api/task-items')
      .set('Authorization', `Bearer ${meToken}`)
      .send({ title: 'Beber agua', kind: 'diaria', belongsTo: me._id.toString() });

    expect(res.status).toBe(201);
    expect(res.body.period).toBe('dia-todo');
  });

  test('periodo invalido ou em tarefa nao-diaria vira dia-todo', async () => {
    const invalido = await request(app)
      .post('/api/task-items')
      .set('Authorization', `Bearer ${meToken}`)
      .send({ title: 'Madrugada', kind: 'diaria', period: 'madrugada', belongsTo: me._id.toString() });
    expect(invalido.status).toBe(201);
    expect(invalido.body.period).toBe('dia-todo');

    const semanal = await request(app)
      .post('/api/task-items')
      .set('Authorization', `Bearer ${meToken}`)
      .send({ title: 'Feira', kind: 'semanal', period: 'manha', belongsTo: me._id.toString() });
    expect(semanal.status).toBe(201);
    expect(semanal.body.period).toBe('dia-todo');
  });

  test('retorna 400 quando o titulo nao e informado', async () => {
    const res = await request(app)
      .post('/api/task-items')
      .set('Authorization', `Bearer ${meToken}`)
      .send({ kind: 'diaria', belongsTo: me._id.toString() });

    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/task-items/:id/toggle', () => {
  test('alterna completed e completedAt', async () => {
    const item = await TaskItem.create({
      title: 'Regar plantas',
      kind: 'diaria',
      belongsTo: me._id,
      createdBy: me._id,
      team: 'principal',
    });

    const res = await request(app).patch(`/api/task-items/${item._id}/toggle`).set('Authorization', `Bearer ${meToken}`);

    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
    expect(res.body.completedAt).not.toBeNull();
  });
});

describe('GET /api/task-items', () => {
  test('filtra por belongsTo', async () => {
    await TaskItem.create({ title: 'Minha tarefa', kind: 'unica', belongsTo: me._id, createdBy: me._id, team: 'principal' });
    await TaskItem.create({
      title: 'Tarefa do parceiro',
      kind: 'unica',
      belongsTo: partner._id,
      createdBy: partner._id,
      team: 'principal',
    });

    const res = await request(app)
      .get(`/api/task-items?belongsTo=${me._id.toString()}`)
      .set('Authorization', `Bearer ${meToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('Minha tarefa');
  });
});

describe('PATCH /api/task-items/:id', () => {
  test('renomeia a tarefa', async () => {
    const item = await TaskItem.create({
      title: 'Lavar louca',
      kind: 'diaria',
      belongsTo: me._id,
      createdBy: me._id,
      team: 'principal',
    });

    const res = await request(app)
      .patch(`/api/task-items/${item._id}`)
      .set('Authorization', `Bearer ${meToken}`)
      .send({ title: '  Lavar a louca do jantar  ' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Lavar a louca do jantar');
  });

  test('retorna 400 quando o titulo novo e vazio', async () => {
    const item = await TaskItem.create({
      title: 'Lavar louca',
      kind: 'diaria',
      belongsTo: me._id,
      createdBy: me._id,
      team: 'principal',
    });

    const res = await request(app)
      .patch(`/api/task-items/${item._id}`)
      .set('Authorization', `Bearer ${meToken}`)
      .send({ title: '   ' });

    expect(res.status).toBe(400);
  });

  test('move a tarefa de periodo sem mexer no titulo', async () => {
    const item = await TaskItem.create({
      title: 'Lavar vasilha',
      kind: 'diaria',
      period: 'manha',
      belongsTo: me._id,
      createdBy: me._id,
      team: 'principal',
    });

    const res = await request(app)
      .patch(`/api/task-items/${item._id}`)
      .set('Authorization', `Bearer ${meToken}`)
      .send({ period: 'tarde' });

    expect(res.status).toBe(200);
    expect(res.body.period).toBe('tarde');
    expect(res.body.title).toBe('Lavar vasilha');
  });

  test('retorna 403 para quem nao e dono nem criador', async () => {
    const item = await TaskItem.create({
      title: 'Tarefa da Maria',
      kind: 'unica',
      belongsTo: partner._id,
      createdBy: partner._id,
      team: 'principal',
    });

    const res = await request(app)
      .patch(`/api/task-items/${item._id}`)
      .set('Authorization', `Bearer ${meToken}`)
      .send({ title: 'Nome novo' });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/task-items/:id', () => {
  test('retorna 403 quando quem remove nao e o dono da lista', async () => {
    const item = await TaskItem.create({
      title: 'Tarefa da Maria',
      kind: 'unica',
      belongsTo: partner._id,
      createdBy: partner._id,
      team: 'principal',
    });

    const res = await request(app).delete(`/api/task-items/${item._id}`).set('Authorization', `Bearer ${meToken}`);

    expect(res.status).toBe(403);
  });

  test('quem adicionou na lista do outro consegue desfazer enquanto nao foi concluida', async () => {
    const item = await TaskItem.create({
      title: 'Adicionei por engano',
      kind: 'unica',
      belongsTo: partner._id,
      createdBy: me._id,
      team: 'principal',
    });

    const res = await request(app).delete(`/api/task-items/${item._id}`).set('Authorization', `Bearer ${meToken}`);

    expect(res.status).toBe(204);
  });

  test('quem adicionou perde o direito de remover depois de concluida', async () => {
    const item = await TaskItem.create({
      title: 'Ja foi feita',
      kind: 'unica',
      belongsTo: partner._id,
      createdBy: me._id,
      completed: true,
      completedAt: new Date(),
      team: 'principal',
    });

    const res = await request(app).delete(`/api/task-items/${item._id}`).set('Authorization', `Bearer ${meToken}`);

    expect(res.status).toBe(403);
  });

  test('dono da lista consegue remover', async () => {
    const item = await TaskItem.create({
      title: 'Tarefa da Maria',
      kind: 'unica',
      belongsTo: partner._id,
      createdBy: partner._id,
      team: 'principal',
    });

    const res = await request(app).delete(`/api/task-items/${item._id}`).set('Authorization', `Bearer ${partnerToken}`);

    expect(res.status).toBe(204);
  });
});

describe('autenticacao', () => {
  test('retorna 401 sem token', async () => {
    const res = await request(app).get('/api/task-items');
    expect(res.status).toBe(401);
  });
});
