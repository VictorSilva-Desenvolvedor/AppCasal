const request = require('supertest');
const app = require('../../../src/app');
const User = require('../../../src/models/User');
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

async function authFor() {
  const user = await User.create({ name: 'Victor', password: 'senha123', team: 'principal' });
  return { Authorization: `Bearer ${tokenFor(user)}` };
}

describe('horário do evento', () => {
  it('salva o horário informado', async () => {
    const auth = await authFor();
    const res = await request(app)
      .post('/api/events')
      .set(auth)
      .send({ title: 'Jantar', date: '2026-10-20', time: '20:30' });

    expect(res.status).toBe(201);
    expect(res.body.time).toBe('20:30');
  });

  it('sem horário, o evento é do dia todo', async () => {
    const auth = await authFor();
    const res = await request(app).post('/api/events').set(auth).send({ title: 'Folga', date: '2026-10-20' });

    expect(res.status).toBe(201);
    expect(res.body.time).toBe('');
  });

  it('recusa horário fora do formato HH:MM', async () => {
    const auth = await authFor();
    const res = await request(app).post('/api/events').set(auth).send({ title: 'X', date: '2026-10-20', time: '25:00' });

    expect(res.status).toBe(400);
  });

  it('atualiza e remove o horário', async () => {
    const auth = await authFor();
    const created = await request(app)
      .post('/api/events')
      .set(auth)
      .send({ title: 'Consulta', date: '2026-10-21', time: '09:00' });

    const updated = await request(app)
      .put(`/api/events/${created.body._id}`)
      .set(auth)
      .send({ title: 'Consulta', date: '2026-10-21', time: '' });

    expect(updated.status).toBe(200);
    expect(updated.body.time).toBe('');
  });
});
