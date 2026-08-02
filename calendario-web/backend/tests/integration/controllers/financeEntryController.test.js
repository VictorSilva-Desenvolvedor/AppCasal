const request = require('supertest');
const app = require('../../../src/app');
const User = require('../../../src/models/User');
const FinanceCategory = require('../../../src/models/FinanceCategory');
const FinanceEntry = require('../../../src/models/FinanceEntry');
const FinanceGoal = require('../../../src/models/FinanceGoal');
const db = require('../../helpers/db');
const { tokenFor } = require('../../helpers/authToken');

let victor;
let maria;
let victorToken;
let mariaToken;

beforeAll(async () => {
  await db.connect();
});

beforeEach(async () => {
  victor = await User.create({ name: 'Victor', password: 'senha123', team: 'principal' });
  maria = await User.create({ name: 'Maria', password: 'senha123', team: 'principal' });
  victorToken = tokenFor(victor);
  mariaToken = tokenFor(maria);
});

afterEach(async () => {
  await db.clearDatabase();
});

afterAll(async () => {
  await db.closeDatabase();
});

function createEntry(overrides = {}) {
  return FinanceEntry.create({
    type: 'despesa',
    description: 'Internet',
    amount: 120,
    date: new Date('2026-08-10'),
    nature: 'fixa',
    paidBy: victor._id,
    creator: victor._id,
    team: 'principal',
    ...overrides,
  });
}

describe('PUT /api/finance-entries/:id/pagar', () => {
  test('marca como pago sem apagar os demais campos do lançamento', async () => {
    const entry = await createEntry({ reason: 'combinado do casal', nature: 'com_prazo' });

    const res = await request(app)
      .put(`/api/finance-entries/${entry._id}/pagar`)
      .set('Authorization', `Bearer ${victorToken}`)
      .send({ paid: true });

    expect(res.status).toBe(200);
    expect(res.body.paidAmount).toBe(120);
    expect(res.body.nature).toBe('com_prazo');
    expect(res.body.reason).toBe('combinado do casal');
  });

  test('desfaz o pagamento zerando paidAmount', async () => {
    const entry = await createEntry({ paidAmount: 120 });

    const res = await request(app)
      .put(`/api/finance-entries/${entry._id}/pagar`)
      .set('Authorization', `Bearer ${victorToken}`)
      .send({ paid: false });

    expect(res.status).toBe(200);
    expect(res.body.paidAmount).toBe(0);
  });

  test('pagar um lançamento vinculado avança o objetivo, e desfazer o devolve', async () => {
    const goal = await FinanceGoal.create({
      name: 'Casinha',
      type: 'parcelamento',
      targetAmount: 1200,
      totalInstallments: 12,
      installmentAmount: 100,
      creator: victor._id,
      team: 'principal',
    });
    const entry = await createEntry({ description: 'Parcela casinha', amount: 100, linkedGoal: goal._id });

    await request(app)
      .put(`/api/finance-entries/${entry._id}/pagar`)
      .set('Authorization', `Bearer ${victorToken}`)
      .send({ paid: true });

    let updatedGoal = await FinanceGoal.findById(goal._id);
    expect(updatedGoal.currentAmount).toBe(100);
    expect(updatedGoal.paidInstallments).toBe(1);

    await request(app)
      .put(`/api/finance-entries/${entry._id}/pagar`)
      .set('Authorization', `Bearer ${victorToken}`)
      .send({ paid: false });

    updatedGoal = await FinanceGoal.findById(goal._id);
    expect(updatedGoal.currentAmount).toBe(0);
    expect(updatedGoal.paidInstallments).toBe(0);
  });

  test('retorna 404 para lançamento de outro time', async () => {
    const outsider = await User.create({ name: 'Alex', password: 'senha123', team: 'outra' });
    const entry = await createEntry({ team: 'outra', paidBy: outsider._id, creator: outsider._id });

    const res = await request(app)
      .put(`/api/finance-entries/${entry._id}/pagar`)
      .set('Authorization', `Bearer ${victorToken}`)
      .send({ paid: true });

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/finance-entries/:id/mover', () => {
  test('muda a natureza e tira o item do planejamento futuro', async () => {
    const entry = await createEntry({ nature: 'unica', wishType: 'desejo' });

    const res = await request(app)
      .put(`/api/finance-entries/${entry._id}/mover`)
      .set('Authorization', `Bearer ${victorToken}`)
      .send({ nature: 'fixa', wishType: null });

    expect(res.status).toBe(200);
    expect(res.body.nature).toBe('fixa');
    expect(res.body.wishType).toBeNull();
  });

  test('muda só a categoria, preservando o resto', async () => {
    const category = await FinanceCategory.create({
      name: 'Moradia',
      type: 'despesa',
      creator: victor._id,
      team: 'principal',
    });
    const entry = await createEntry({ nature: 'com_prazo' });

    const res = await request(app)
      .put(`/api/finance-entries/${entry._id}/mover`)
      .set('Authorization', `Bearer ${victorToken}`)
      .send({ category: category._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.category._id).toBe(category._id.toString());
    expect(res.body.nature).toBe('com_prazo');
    expect(res.body.amount).toBe(120);
  });

  test('rejeita natureza fora do enum', async () => {
    const entry = await createEntry();

    const res = await request(app)
      .put(`/api/finance-entries/${entry._id}/mover`)
      .set('Authorization', `Bearer ${victorToken}`)
      .send({ nature: 'inventada' });

    expect(res.status).toBe(400);
  });
});

describe('edição cruzada entre parceiros', () => {
  test('Maria pode pagar um lançamento que o Victor pagou', async () => {
    const entry = await createEntry();

    const res = await request(app)
      .put(`/api/finance-entries/${entry._id}/pagar`)
      .set('Authorization', `Bearer ${mariaToken}`)
      .send({ paid: true });

    expect(res.status).toBe(200);
    expect(res.body.paidAmount).toBe(120);
  });

  test('Maria pode editar e excluir um lançamento do Victor', async () => {
    const entry = await createEntry();

    const update = await request(app)
      .put(`/api/finance-entries/${entry._id}`)
      .set('Authorization', `Bearer ${mariaToken}`)
      .send({ type: 'despesa', description: 'Internet fibra', amount: 150, date: '2026-08-10', nature: 'fixa' });

    expect(update.status).toBe(200);
    expect(update.body.description).toBe('Internet fibra');

    const removal = await request(app)
      .delete(`/api/finance-entries/${entry._id}`)
      .set('Authorization', `Bearer ${mariaToken}`);

    expect(removal.status).toBe(204);
    expect(await FinanceEntry.findById(entry._id)).toBeNull();
  });

  test('Maria pode editar e excluir um objetivo do Victor', async () => {
    const goal = await FinanceGoal.create({
      name: 'Viagem',
      targetAmount: 5000,
      creator: victor._id,
      team: 'principal',
    });

    const update = await request(app)
      .put(`/api/finance-goals/${goal._id}`)
      .set('Authorization', `Bearer ${mariaToken}`)
      .send({ name: 'Viagem', targetAmount: 5000, currentAmount: 1000 });

    expect(update.status).toBe(200);
    expect(update.body.currentAmount).toBe(1000);

    const removal = await request(app)
      .delete(`/api/finance-goals/${goal._id}`)
      .set('Authorization', `Bearer ${mariaToken}`);

    expect(removal.status).toBe(204);
  });
});
