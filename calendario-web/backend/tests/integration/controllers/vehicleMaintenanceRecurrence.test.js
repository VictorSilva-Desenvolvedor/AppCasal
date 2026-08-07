const request = require('supertest');
const app = require('../../../src/app');
const User = require('../../../src/models/User');
const Vehicle = require('../../../src/models/Vehicle');
const VehicleMaintenance = require('../../../src/models/VehicleMaintenance');
const db = require('../../helpers/db');
const { tokenFor } = require('../../helpers/authToken');

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

async function createVehicle(overrides = {}) {
  const res = await request(app)
    .post('/api/vehicles')
    .set('Authorization', `Bearer ${meToken}`)
    .send({ name: 'CB Twister 250F', currentOdometer: 10000, ...overrides });
  return res.body;
}

describe('Manutenção recorrente', () => {
  test('concluir item com recurrenceKm gera a próxima ocorrência pendente no odômetro certo', async () => {
    const vehicle = await createVehicle({ currentOdometer: 10000 });

    const createRes = await request(app)
      .post('/api/vehicle-maintenances')
      .set('Authorization', `Bearer ${meToken}`)
      .send({ vehicle: vehicle._id, title: 'Troca de óleo', category: 'oleo', recurrenceKm: 3000 });
    expect(createRes.body.recurrenceKm).toBe(3000);

    await request(app)
      .post(`/api/vehicle-maintenances/${createRes.body._id}/complete`)
      .set('Authorization', `Bearer ${meToken}`)
      .send({ completedOdometer: 10100 });

    const items = await VehicleMaintenance.find({ vehicle: vehicle._id }).sort({ createdAt: 1 });
    expect(items).toHaveLength(2);
    expect(items[0].status).toBe('concluido');
    expect(items[1].status).toBe('pendente');
    expect(items[1].title).toBe('Troca de óleo');
    expect(items[1].dueOdometer).toBe(13100);
    expect(items[1].recurrenceKm).toBe(3000);
  });

  test('concluir item com recurrenceDays gera a próxima ocorrência com dueDate certo', async () => {
    const vehicle = await createVehicle();

    const createRes = await request(app)
      .post('/api/vehicle-maintenances')
      .set('Authorization', `Bearer ${meToken}`)
      .send({ vehicle: vehicle._id, title: 'Calibrar pneus', category: 'pneus', recurrenceDays: 7 });

    const completeRes = await request(app)
      .post(`/api/vehicle-maintenances/${createRes.body._id}/complete`)
      .set('Authorization', `Bearer ${meToken}`)
      .send({});

    const completedAt = new Date(completeRes.body.completedAt);
    const items = await VehicleMaintenance.find({ vehicle: vehicle._id, status: 'pendente' });
    expect(items).toHaveLength(1);

    const expectedDue = completedAt.getTime() + 7 * 24 * 60 * 60 * 1000;
    expect(new Date(items[0].dueDate).getTime()).toBe(expectedDue);
  });

  test('observação na conclusão fica anexada ao histórico, sem virar template da próxima ocorrência', async () => {
    const vehicle = await createVehicle({ currentOdometer: 10000 });

    const createRes = await request(app)
      .post('/api/vehicle-maintenances')
      .set('Authorization', `Bearer ${meToken}`)
      .send({
        vehicle: vehicle._id,
        title: 'Verificar pastilhas de freio',
        category: 'freios',
        recurrenceKm: 4000,
        notes: 'Tarefa padrão do checklist',
      });

    const completeRes = await request(app)
      .post(`/api/vehicle-maintenances/${createRes.body._id}/complete`)
      .set('Authorization', `Bearer ${meToken}`)
      .send({ completedOdometer: 10100, notes: 'Pastilha dianteira já fina, olhar de novo em breve' });

    expect(completeRes.body.notes).toBe(
      'Tarefa padrão do checklist\n\nPastilha dianteira já fina, olhar de novo em breve'
    );

    const items = await VehicleMaintenance.find({ vehicle: vehicle._id }).sort({ createdAt: 1 });
    expect(items[0].notes).toContain('Pastilha dianteira já fina');
    // a próxima ocorrência recorrente não herda a observação da conclusão anterior
    expect(items[1].status).toBe('pendente');
    expect(items[1].notes).toBe('Tarefa padrão do checklist');
  });

  test('item sem recorrência não gera nova ocorrência ao concluir', async () => {
    const vehicle = await createVehicle();

    const createRes = await request(app)
      .post('/api/vehicle-maintenances')
      .set('Authorization', `Bearer ${meToken}`)
      .send({ vehicle: vehicle._id, title: 'Revisão avulsa', dueOdometer: 10500 });

    await request(app)
      .post(`/api/vehicle-maintenances/${createRes.body._id}/complete`)
      .set('Authorization', `Bearer ${meToken}`)
      .send({ completedOdometer: 10500 });

    const items = await VehicleMaintenance.find({ vehicle: vehicle._id });
    expect(items).toHaveLength(1);
    expect(items[0].status).toBe('concluido');
  });
});

describe('POST /api/vehicle-maintenances/apply-preset', () => {
  test('aplica o checklist da CB Twister 250F 2019', async () => {
    const vehicle = await createVehicle({ currentOdometer: 10000 });

    const res = await request(app)
      .post('/api/vehicle-maintenances/apply-preset')
      .set('Authorization', `Bearer ${meToken}`)
      .send({ vehicle: vehicle._id, preset: 'honda-cb-twister-250f-2019' });

    expect(res.status).toBe(201);
    expect(res.body.created.length).toBeGreaterThan(5);
    expect(res.body.skipped).toEqual([]);

    const oilChange = res.body.created.find((item) => item.title === 'Troca de óleo do motor');
    expect(oilChange.dueOdometer).toBe(13000);

    const tirePressure = res.body.created.find((item) => item.title === 'Calibrar pneus');
    expect(tirePressure.dueDate).toBeTruthy();
    expect(tirePressure.dueOdometer).toBe(10500);

    const total = await VehicleMaintenance.countDocuments({ vehicle: vehicle._id });
    expect(total).toBe(res.body.created.length);
  });

  test('preenche a foto padrão do veículo quando ele ainda não tem uma', async () => {
    const vehicle = await createVehicle();

    await request(app)
      .post('/api/vehicle-maintenances/apply-preset')
      .set('Authorization', `Bearer ${meToken}`)
      .send({ vehicle: vehicle._id, preset: 'honda-cb-twister-250f-2019' });

    const updated = await Vehicle.findById(vehicle._id);
    expect(updated.photoUrl).toBe('/vehicle-photos/honda-cb-twister-2019.webp');
  });

  test('não sobrescreve a foto se o veículo já tiver uma', async () => {
    const vehicle = await createVehicle({ photoUrl: 'https://exemplo.com/minha-foto.jpg' });

    await request(app)
      .post('/api/vehicle-maintenances/apply-preset')
      .set('Authorization', `Bearer ${meToken}`)
      .send({ vehicle: vehicle._id, preset: 'honda-cb-twister-250f-2019' });

    const updated = await Vehicle.findById(vehicle._id);
    expect(updated.photoUrl).toBe('https://exemplo.com/minha-foto.jpg');
  });

  test('não duplica itens já pendentes ao aplicar de novo', async () => {
    const vehicle = await createVehicle();

    const first = await request(app)
      .post('/api/vehicle-maintenances/apply-preset')
      .set('Authorization', `Bearer ${meToken}`)
      .send({ vehicle: vehicle._id, preset: 'honda-cb-twister-250f-2019' });

    const second = await request(app)
      .post('/api/vehicle-maintenances/apply-preset')
      .set('Authorization', `Bearer ${meToken}`)
      .send({ vehicle: vehicle._id, preset: 'honda-cb-twister-250f-2019' });

    expect(second.body.created).toHaveLength(0);
    expect(second.body.skipped.length).toBe(first.body.created.length);

    const total = await VehicleMaintenance.countDocuments({ vehicle: vehicle._id });
    expect(total).toBe(first.body.created.length);
  });

  test('rejeita preset desconhecido', async () => {
    const vehicle = await createVehicle();
    const res = await request(app)
      .post('/api/vehicle-maintenances/apply-preset')
      .set('Authorization', `Bearer ${meToken}`)
      .send({ vehicle: vehicle._id, preset: 'nao-existe' });

    expect(res.status).toBe(400);
  });
});
