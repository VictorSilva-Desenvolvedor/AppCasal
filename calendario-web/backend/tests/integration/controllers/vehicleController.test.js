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
    .send({ name: 'Ducati Panigale V4', currentOdometer: 12000, ...overrides });
  return res.body;
}

describe('POST /api/vehicles', () => {
  test('cria um veiculo', async () => {
    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${meToken}`)
      .send({ name: 'Ducati Panigale V4', brand: 'Ducati', currentOdometer: 12000 });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Ducati Panigale V4');
    expect(res.body.currentOdometer).toBe(12000);
  });

  test('rejeita sem nome', async () => {
    const res = await request(app).post('/api/vehicles').set('Authorization', `Bearer ${meToken}`).send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /api/vehicles', () => {
  test('lista apenas veiculos do time, sem os arquivados', async () => {
    const vehicle = await createVehicle();
    await request(app)
      .put(`/api/vehicles/${vehicle._id}`)
      .set('Authorization', `Bearer ${meToken}`)
      .send({ archived: true });
    await createVehicle({ name: 'Segundo veículo' });

    const res = await request(app).get('/api/vehicles').set('Authorization', `Bearer ${meToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Segundo veículo');
  });
});

describe('Manutenção de veículo', () => {
  test('concluir manutenção atualiza o odômetro do veículo quando maior', async () => {
    const vehicle = await createVehicle({ currentOdometer: 12000 });

    const maintenanceRes = await request(app)
      .post('/api/vehicle-maintenances')
      .set('Authorization', `Bearer ${meToken}`)
      .send({ vehicle: vehicle._id, title: 'Troca de óleo', category: 'oleo', dueOdometer: 12500 });
    expect(maintenanceRes.status).toBe(201);

    const completeRes = await request(app)
      .post(`/api/vehicle-maintenances/${maintenanceRes.body._id}/complete`)
      .set('Authorization', `Bearer ${meToken}`)
      .send({ completedOdometer: 12600 });

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.status).toBe('concluido');

    const updatedVehicle = await Vehicle.findById(vehicle._id);
    expect(updatedVehicle.currentOdometer).toBe(12600);
  });

  test('não retrocede o odômetro se o valor informado for menor', async () => {
    const vehicle = await createVehicle({ currentOdometer: 12000 });
    const maintenance = await VehicleMaintenance.create({
      vehicle: vehicle._id,
      title: 'Revisão',
      creator: me._id,
      team: 'principal',
    });

    await request(app)
      .post(`/api/vehicle-maintenances/${maintenance._id}/complete`)
      .set('Authorization', `Bearer ${meToken}`)
      .send({ completedOdometer: 11000 });

    const updatedVehicle = await Vehicle.findById(vehicle._id);
    expect(updatedVehicle.currentOdometer).toBe(12000);
  });

  test('remover um veiculo remove suas manutenções e pagamentos', async () => {
    const vehicle = await createVehicle();
    await request(app)
      .post('/api/vehicle-maintenances')
      .set('Authorization', `Bearer ${meToken}`)
      .send({ vehicle: vehicle._id, title: 'Revisão', dueOdometer: 15000 });
    await request(app)
      .post('/api/vehicle-payments')
      .set('Authorization', `Bearer ${meToken}`)
      .send({ vehicle: vehicle._id, description: 'IPVA', amount: 300, dueDate: '2026-01-01' });

    const deleteRes = await request(app).delete(`/api/vehicles/${vehicle._id}`).set('Authorization', `Bearer ${meToken}`);
    expect(deleteRes.status).toBe(204);

    const remainingMaintenances = await VehicleMaintenance.countDocuments({ vehicle: vehicle._id });
    expect(remainingMaintenances).toBe(0);
  });
});

describe('Pagamentos de veículo', () => {
  test('marca um pagamento como pago', async () => {
    const vehicle = await createVehicle();
    const paymentRes = await request(app)
      .post('/api/vehicle-payments')
      .set('Authorization', `Bearer ${meToken}`)
      .send({ vehicle: vehicle._id, description: 'IPVA 2026', amount: 450, dueDate: '2026-02-01' });
    expect(paymentRes.status).toBe(201);

    const payRes = await request(app)
      .post(`/api/vehicle-payments/${paymentRes.body._id}/pay`)
      .set('Authorization', `Bearer ${meToken}`);

    expect(payRes.status).toBe(200);
    expect(payRes.body.status).toBe('pago');
    expect(payRes.body.paidAt).toBeTruthy();
  });
});
