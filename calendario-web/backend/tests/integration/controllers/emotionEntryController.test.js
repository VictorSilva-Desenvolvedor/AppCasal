const request = require('supertest');
const app = require('../../../src/app');
const User = require('../../../src/models/User');
const EmotionEntry = require('../../../src/models/EmotionEntry');
const db = require('../../helpers/db');
const { tokenFor } = require('../../helpers/authToken');

let me;
let partner;
let outsider;
let meToken;
let partnerToken;
let outsiderToken;

const DAY = '2026-08-03';

function baseEntry(overrides = {}) {
  return { day: DAY, period: 'manha', emotion: 'feliz', intensity: 3, ...overrides };
}

beforeAll(async () => {
  await db.connect();
});

beforeEach(async () => {
  me = await User.create({ name: 'Vitor', password: 'senha123', team: 'principal' });
  partner = await User.create({ name: 'Maria', password: 'senha123', team: 'principal' });
  outsider = await User.create({ name: 'Estranho', password: 'senha123', team: 'outro' });
  meToken = tokenFor(me);
  partnerToken = tokenFor(partner);
  outsiderToken = tokenFor(outsider);
});

afterEach(async () => {
  await db.clearDatabase();
});

afterAll(async () => {
  await db.closeDatabase();
});

describe('POST /api/emotion-entries', () => {
  test('cria um registro e devolve o usuario populado', async () => {
    const res = await request(app)
      .post('/api/emotion-entries')
      .set('Authorization', `Bearer ${meToken}`)
      .send(baseEntry({ note: 'dia bom', reasons: ['trabalho'] }));

    expect(res.status).toBe(201);
    expect(res.body.emotion).toBe('feliz');
    expect(res.body.intensity).toBe(3);
    expect(res.body.note).toBe('dia bom');
    expect(res.body.reasons).toEqual(['trabalho']);
    expect(res.body.user.name).toBe('Vitor');
    expect(res.body.team).toBe('principal');
  });

  test('retorna 400 quando falta campo obrigatorio', async () => {
    const semIntensidade = { day: DAY, period: 'manha', emotion: 'feliz' };
    const res = await request(app)
      .post('/api/emotion-entries')
      .set('Authorization', `Bearer ${meToken}`)
      .send(semIntensidade);

    expect(res.status).toBe(400);
  });

  test('retorna 400 para emocao fora do enum', async () => {
    const res = await request(app)
      .post('/api/emotion-entries')
      .set('Authorization', `Bearer ${meToken}`)
      .send(baseEntry({ emotion: 'euforico' }));

    expect(res.status).toBe(400);
  });

  test('retorna 400 para intensidade fora da faixa 1-5', async () => {
    const res = await request(app)
      .post('/api/emotion-entries')
      .set('Authorization', `Bearer ${meToken}`)
      .send(baseEntry({ intensity: 9 }));

    expect(res.status).toBe(400);
  });

  test.each(['saudade', 'eros'])('aceita a emocao %s', async (emotion) => {
    const res = await request(app)
      .post('/api/emotion-entries')
      .set('Authorization', `Bearer ${meToken}`)
      .send(baseEntry({ emotion }));

    expect(res.status).toBe(201);
    expect(res.body.emotion).toBe(emotion);
  });
});

describe('GET /api/emotion-entries', () => {
  test('filtra por usuario', async () => {
    await EmotionEntry.create(baseEntry({ user: me._id, team: 'principal' }));
    await EmotionEntry.create(baseEntry({ emotion: 'triste', user: partner._id, team: 'principal' }));

    const res = await request(app)
      .get('/api/emotion-entries')
      .query({ user: partner._id.toString() })
      .set('Authorization', `Bearer ${meToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].emotion).toBe('triste');
  });

  test('filtra por dia e periodo', async () => {
    await EmotionEntry.create(baseEntry({ user: me._id, team: 'principal' }));
    await EmotionEntry.create(baseEntry({ period: 'noite', user: me._id, team: 'principal' }));
    await EmotionEntry.create(baseEntry({ day: '2026-08-02', user: me._id, team: 'principal' }));

    const res = await request(app)
      .get('/api/emotion-entries')
      .query({ day: DAY, period: 'noite' })
      .set('Authorization', `Bearer ${meToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].period).toBe('noite');
  });

  test('nao devolve registros de outro time', async () => {
    await EmotionEntry.create(baseEntry({ user: me._id, team: 'principal' }));
    await EmotionEntry.create(baseEntry({ user: outsider._id, team: 'outro' }));

    const res = await request(app).get('/api/emotion-entries').set('Authorization', `Bearer ${outsiderToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].user._id).toBe(outsider._id.toString());
  });
});

describe('PUT /api/emotion-entries/:id', () => {
  test('o dono atualiza nota e intensidade', async () => {
    const entry = await EmotionEntry.create(baseEntry({ user: me._id, team: 'principal' }));

    const res = await request(app)
      .put(`/api/emotion-entries/${entry._id}`)
      .set('Authorization', `Bearer ${meToken}`)
      .send({ note: 'corrigido', intensity: 5 });

    expect(res.status).toBe(200);
    expect(res.body.note).toBe('corrigido');
    expect(res.body.intensity).toBe(5);
  });

  test('retorna 403 quando o parceiro tenta editar campos do dono', async () => {
    const entry = await EmotionEntry.create(baseEntry({ user: me._id, team: 'principal' }));

    const res = await request(app)
      .put(`/api/emotion-entries/${entry._id}`)
      .set('Authorization', `Bearer ${partnerToken}`)
      .send({ note: 'invadindo' });

    expect(res.status).toBe(403);
    expect((await EmotionEntry.findById(entry._id)).note).toBe('');
  });

  test('o parceiro pode escrever helpText e a autoria fica registrada', async () => {
    const entry = await EmotionEntry.create(baseEntry({ user: me._id, team: 'principal' }));

    const res = await request(app)
      .put(`/api/emotion-entries/${entry._id}`)
      .set('Authorization', `Bearer ${partnerToken}`)
      .send({ helpText: 'te levo pra tomar um sorvete' });

    expect(res.status).toBe(200);
    expect(res.body.helpText).toBe('te levo pra tomar um sorvete');
    expect(res.body.helpTextBy).toBe(partner._id.toString());
    expect(res.body.helpTextAt).not.toBeNull();
  });

  test('o parceiro que manda helpText junto de nota nao altera a nota', async () => {
    const entry = await EmotionEntry.create(baseEntry({ user: me._id, team: 'principal' }));

    const res = await request(app)
      .put(`/api/emotion-entries/${entry._id}`)
      .set('Authorization', `Bearer ${partnerToken}`)
      .send({ helpText: 'apoio', note: 'invadindo' });

    expect(res.status).toBe(200);
    expect(res.body.helpText).toBe('apoio');
    expect(res.body.note).toBe('');
  });

  test('retorna 404 para registro de outro time', async () => {
    const entry = await EmotionEntry.create(baseEntry({ user: outsider._id, team: 'outro' }));

    const res = await request(app)
      .put(`/api/emotion-entries/${entry._id}`)
      .set('Authorization', `Bearer ${meToken}`)
      .send({ note: 'nao deveria achar' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/emotion-entries/:id', () => {
  test('o dono remove o proprio registro', async () => {
    const entry = await EmotionEntry.create(baseEntry({ user: me._id, team: 'principal' }));

    const res = await request(app)
      .delete(`/api/emotion-entries/${entry._id}`)
      .set('Authorization', `Bearer ${meToken}`);

    expect(res.status).toBe(204);
    expect(await EmotionEntry.findById(entry._id)).toBeNull();
  });

  test('retorna 403 quando o parceiro tenta remover', async () => {
    const entry = await EmotionEntry.create(baseEntry({ user: me._id, team: 'principal' }));

    const res = await request(app)
      .delete(`/api/emotion-entries/${entry._id}`)
      .set('Authorization', `Bearer ${partnerToken}`);

    expect(res.status).toBe(403);
    expect(await EmotionEntry.findById(entry._id)).not.toBeNull();
  });

  test('retorna 404 para registro de outro time', async () => {
    const entry = await EmotionEntry.create(baseEntry({ user: outsider._id, team: 'outro' }));

    const res = await request(app)
      .delete(`/api/emotion-entries/${entry._id}`)
      .set('Authorization', `Bearer ${meToken}`);

    expect(res.status).toBe(404);
  });
});
