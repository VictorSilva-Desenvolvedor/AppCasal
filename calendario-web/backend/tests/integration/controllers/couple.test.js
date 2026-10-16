const request = require('supertest');
const app = require('../../../src/app');
const User = require('../../../src/models/User');
const Event = require('../../../src/models/Event');
const FinanceCategory = require('../../../src/models/FinanceCategory');
const FinanceEntry = require('../../../src/models/FinanceEntry');
const CoupleCode = require('../../../src/models/CoupleCode');
const db = require('../../helpers/db');

beforeAll(async () => {
  await db.connect();
});

afterEach(async () => {
  await db.clearDatabase();
});

afterAll(async () => {
  await db.closeDatabase();
});

async function registerUser(name, extra = {}) {
  const res = await request(app).post('/api/auth/register').send({ name, password: 'senha123', ...extra });
  return { res, auth: { Authorization: `Bearer ${res.body.token}` }, user: res.body.user };
}

async function codeFor(auth) {
  const res = await request(app).post('/api/couple/code').set(auth);
  return res;
}

describe('código do casal', () => {
  it('gera um código de 6 caracteres e reaproveita o mesmo enquanto vale', async () => {
    const ana = await registerUser('Ana');
    const first = await codeFor(ana.auth);
    const second = await codeFor(ana.auth);

    expect(first.status).toBe(200);
    expect(first.body.code).toMatch(/^[A-Z2-9]{6}$/);
    expect(second.body.code).toBe(first.body.code);
  });

  it('o parceiro entra no espaço do casal e leva os próprios dados', async () => {
    const ana = await registerUser('Ana');
    const bia = await registerUser('Bia');
    await request(app).post('/api/events').set(bia.auth).send({ title: 'Dentista da Bia', date: '2026-10-20' });
    const { body } = await codeFor(ana.auth);

    const join = await request(app).post('/api/couple/join').set(bia.auth).send({ code: body.code.toLowerCase() });

    expect(join.status).toBe(200);
    expect(join.body.user.team).toBe(ana.user.team);
    expect(join.body.token).toBeTruthy();

    const anaEvents = await request(app).get('/api/events').set(ana.auth);
    expect(anaEvents.body.map((e) => e.title)).toContain('Dentista da Bia');

    const anaUsers = await request(app).get('/api/users').set(ana.auth);
    expect(anaUsers.body.map((u) => u.name).sort()).toEqual(['Ana', 'Bia']);
  });

  it('unifica as categorias financeiras repetidas e mantém os lançamentos apontando para a que ficou', async () => {
    const ana = await registerUser('Ana');
    const bia = await registerUser('Bia');
    const biaCat = await FinanceCategory.findOne({ team: bia.user.team, type: 'despesa' });
    await request(app)
      .post('/api/finance-entries')
      .set(bia.auth)
      .send({ type: 'despesa', description: 'Mercado', amount: 100, date: '2026-10-10', category: biaCat._id });
    const { body } = await codeFor(ana.auth);

    await request(app).post('/api/couple/join').set(bia.auth).send({ code: body.code });

    const team = ana.user.team;
    const names = (await FinanceCategory.find({ team })).map((c) => `${c.type}:${c.name}`);
    expect(new Set(names).size).toBe(names.length);
    const entry = await FinanceEntry.findOne({ team, description: 'Mercado' });
    const cat = await FinanceCategory.findById(entry.category);
    expect(cat).not.toBeNull();
    expect(cat.team).toBe(team);
    expect(cat.name).toBe(biaCat.name);
  });

  it('cadastro com o código já entra no espaço do casal', async () => {
    const ana = await registerUser('Ana');
    const { body } = await codeFor(ana.auth);

    const bia = await registerUser('Bia', { coupleCode: body.code });

    expect(bia.res.status).toBe(201);
    expect(bia.user.team).toBe(ana.user.team);
  });

  it('código inválido no cadastro não cria a conta', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Bia', password: 'senha123', coupleCode: 'ZZZZZZ' });

    expect(res.status).toBe(404);
    expect(await User.countDocuments({ name: 'Bia' })).toBe(0);
  });

  it('recusa o próprio código, código usado e espaço cheio', async () => {
    const ana = await registerUser('Ana');
    const bia = await registerUser('Bia');
    const caio = await registerUser('Caio');
    const { body } = await codeFor(ana.auth);

    const own = await request(app).post('/api/couple/join').set(ana.auth).send({ code: body.code });
    expect(own.status).toBe(400);

    await request(app).post('/api/couple/join').set(bia.auth).send({ code: body.code });
    const reused = await request(app).post('/api/couple/join').set(caio.auth).send({ code: body.code });
    expect(reused.status).toBe(404);

    const full = await codeFor(ana.auth);
    expect(full.status).toBe(409);
  });

  it('recusa código expirado', async () => {
    const ana = await registerUser('Ana');
    const bia = await registerUser('Bia');
    const { body } = await codeFor(ana.auth);
    await CoupleCode.updateOne({ code: body.code }, { $set: { expiresAt: new Date(Date.now() - 1000) } });

    const res = await request(app).post('/api/couple/join').set(bia.auth).send({ code: body.code });
    expect(res.status).toBe(404);
  });

  it('não move os dados de outros times', async () => {
    const ana = await registerUser('Ana');
    const bia = await registerUser('Bia');
    const outro = await registerUser('Outro');
    await request(app).post('/api/events').set(outro.auth).send({ title: 'Do outro', date: '2026-10-20' });
    const { body } = await codeFor(ana.auth);

    await request(app).post('/api/couple/join').set(bia.auth).send({ code: body.code });

    const ev = await Event.findOne({ title: 'Do outro' });
    expect(ev.team).toBe(outro.user.team);
  });
});
