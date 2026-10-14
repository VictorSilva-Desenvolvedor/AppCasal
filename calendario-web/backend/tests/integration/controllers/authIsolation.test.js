const request = require('supertest');
const app = require('../../../src/app');
const User = require('../../../src/models/User');
const Event = require('../../../src/models/Event');
const FinanceCategory = require('../../../src/models/FinanceCategory');
const db = require('../../helpers/db');
const { tokenFor } = require('../../helpers/authToken');

beforeAll(async () => {
  await db.connect();
});

afterEach(async () => {
  await db.clearDatabase();
});

afterAll(async () => {
  await db.closeDatabase();
});

describe('cadastro', () => {
  it('coloca a conta nova num time só dela, nunca no principal', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Novata', password: 'senha123' });

    expect(res.status).toBe(201);
    expect(res.body.user.team).not.toBe('principal');
    expect(res.body.user.team).toBe(`solo-${res.body.user._id}`);
  });

  it('cria as categorias financeiras padrão no time da conta nova', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Novata', password: 'senha123' });

    const categories = await FinanceCategory.find({ team: res.body.user.team });
    expect(categories.length).toBeGreaterThan(0);
    expect(categories.some((c) => c.type === 'despesa')).toBe(true);
  });

  it('não deixa a conta nova ver eventos nem usuários do casal', async () => {
    const victor = await User.create({ name: 'Victor', password: 'senha123', team: 'principal' });
    await Event.create({ title: 'Aniversário de namoro', date: new Date(), creator: victor._id, team: 'principal' });

    const reg = await request(app).post('/api/auth/register').send({ name: 'Novata', password: 'senha123' });
    const auth = { Authorization: `Bearer ${reg.body.token}` };

    const events = await request(app).get('/api/events').set(auth);
    const users = await request(app).get('/api/users').set(auth);

    expect(events.status).toBe(200);
    expect(events.body).toHaveLength(0);
    expect(users.body.map((u) => u.name)).toEqual(['Novata']);
  });
});

describe('middleware de auth', () => {
  it('rejeita token de usuário que foi apagado', async () => {
    const ghost = await User.create({ name: 'Fantasma', password: 'senha123', team: 'principal' });
    const token = tokenFor(ghost);
    await User.deleteOne({ _id: ghost._id });

    const res = await request(app).get('/api/events').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
  });

  it('usa o time do banco, não o do token', async () => {
    const user = await User.create({ name: 'Mudou', password: 'senha123', team: 'principal' });
    const staleToken = tokenFor(user);
    await User.updateOne({ _id: user._id }, { team: 'outro' });
    await Event.create({ title: 'Do principal', date: new Date(), creator: user._id, team: 'principal' });

    const res = await request(app).get('/api/events').set('Authorization', `Bearer ${staleToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });
});
