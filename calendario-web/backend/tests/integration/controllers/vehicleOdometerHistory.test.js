const request = require('supertest');
const app = require('../../../src/app');
const User = require('../../../src/models/User');
const Vehicle = require('../../../src/models/Vehicle');
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
    .send({ name: 'CB Twister 250F', currentOdometer: 30000, ...overrides });
  return res.body;
}

describe('Histórico e reversão do odômetro', () => {
  test('permite diminuir o odômetro (corrigir erro de digitação) e guarda o valor anterior', async () => {
    const vehicle = await createVehicle({ currentOdometer: 30000 });

    // digitou um zero a mais por engano
    await request(app)
      .put(`/api/vehicles/${vehicle._id}`)
      .set('Authorization', `Bearer ${meToken}`)
      .send({ currentOdometer: 300000 });

    // corrige de volta
    const fixRes = await request(app)
      .put(`/api/vehicles/${vehicle._id}`)
      .set('Authorization', `Bearer ${meToken}`)
      .send({ currentOdometer: 30000 });

    expect(fixRes.status).toBe(200);
    expect(fixRes.body.currentOdometer).toBe(30000);
    expect(fixRes.body.odometerHistory[0].value).toBe(300000);
    expect(fixRes.body.odometerHistory[1].value).toBe(30000);
  });

  test('não grava histórico quando o valor não muda', async () => {
    const vehicle = await createVehicle({ currentOdometer: 30000 });

    const res = await request(app)
      .put(`/api/vehicles/${vehicle._id}`)
      .set('Authorization', `Bearer ${meToken}`)
      .send({ currentOdometer: 30000, notes: 'sem mudança de km' });

    expect(res.body.odometerHistory).toHaveLength(0);
  });

  test('concluir manutenção com km maior também grava o valor anterior no histórico', async () => {
    const vehicle = await createVehicle({ currentOdometer: 30000 });

    const maintenanceRes = await request(app)
      .post('/api/vehicle-maintenances')
      .set('Authorization', `Bearer ${meToken}`)
      .send({ vehicle: vehicle._id, title: 'Troca de óleo', dueOdometer: 30500 });

    await request(app)
      .post(`/api/vehicle-maintenances/${maintenanceRes.body._id}/complete`)
      .set('Authorization', `Bearer ${meToken}`)
      .send({ completedOdometer: 30600 });

    const updated = await Vehicle.findById(vehicle._id);
    expect(updated.currentOdometer).toBe(30600);
    expect(updated.odometerHistory[0].value).toBe(30000);
  });

  test('limita o histórico aos 15 valores mais recentes', async () => {
    const vehicle = await createVehicle({ currentOdometer: 0 });

    let current = 0;
    for (let i = 1; i <= 20; i += 1) {
      current += 100;
      // eslint-disable-next-line no-await-in-loop
      await request(app)
        .put(`/api/vehicles/${vehicle._id}`)
        .set('Authorization', `Bearer ${meToken}`)
        .send({ currentOdometer: current });
    }

    const updated = await Vehicle.findById(vehicle._id);
    expect(updated.odometerHistory).toHaveLength(15);
    expect(updated.odometerHistory[0].value).toBe(1900);
  });
});
