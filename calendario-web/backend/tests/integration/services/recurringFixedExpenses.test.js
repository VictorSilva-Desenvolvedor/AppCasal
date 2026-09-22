const User = require('../../../src/models/User');
const FinanceEntry = require('../../../src/models/FinanceEntry');
const FinanceMonth = require('../../../src/models/FinanceMonth');
const { ensureCurrentMonth } = require('../../../src/controllers/financeMonthController');
const db = require('../../helpers/db');

let maria;

// Só o Date é falsificado: timers reais continuam rodando pro Mongo em memória.
function setToday(iso) {
  jest.useFakeTimers({
    now: new Date(iso),
    doNotFake: ['nextTick', 'setImmediate', 'clearImmediate', 'setTimeout', 'clearTimeout',
      'setInterval', 'clearInterval', 'queueMicrotask', 'hrtime', 'performance'],
  });
}

function fixedEntry(overrides = {}) {
  return FinanceEntry.create({
    type: 'despesa',
    description: 'Academia',
    amount: 99,
    date: new Date(2026, 7, 15),
    nature: 'fixa',
    paidBy: maria._id,
    creator: maria._id,
    team: 'principal',
    ...overrides,
  });
}

function entriesIn(month, year) {
  return FinanceEntry.find({ date: { $gte: new Date(year, month - 1, 1), $lt: new Date(year, month, 1) } });
}

beforeAll(async () => {
  await db.connect();
});

beforeEach(async () => {
  maria = await User.create({ name: 'Maria', password: 'senha123', team: 'principal' });
});

afterEach(async () => {
  jest.useRealTimers();
  await db.clearDatabase();
});

afterAll(async () => {
  await db.closeDatabase();
});

describe('ensureCurrentMonth — despesas fixas', () => {
  test('copia o fixo marcado depois que o mês atual já tinha sido aberto', async () => {
    setToday('2026-09-10T12:00:00-03:00');
    await FinanceMonth.create({ month: 8, year: 2026, team: 'principal' });
    await FinanceMonth.create({ month: 9, year: 2026, team: 'principal' });
    await fixedEntry();

    await ensureCurrentMonth('principal');

    const setembro = await entriesIn(9, 2026);
    expect(setembro).toHaveLength(1);
    expect(setembro[0].description).toBe('Academia');
    expect(setembro[0].date.getDate()).toBe(15);
    expect(setembro[0].paidAmount).toBe(0);
  });

  test('não duplica ao rodar várias vezes', async () => {
    setToday('2026-09-10T12:00:00-03:00');
    await FinanceMonth.create({ month: 8, year: 2026, team: 'principal' });
    await fixedEntry();

    await ensureCurrentMonth('principal');
    await ensureCurrentMonth('principal');

    expect(await entriesIn(9, 2026)).toHaveLength(1);
  });

  test('não recria um fixo apagado de propósito no mês', async () => {
    setToday('2026-09-10T12:00:00-03:00');
    await FinanceMonth.create({ month: 8, year: 2026, team: 'principal' });
    await fixedEntry();

    await ensureCurrentMonth('principal');
    const [copia] = await entriesIn(9, 2026);
    await FinanceEntry.deleteOne({ _id: copia._id });
    await ensureCurrentMonth('principal');

    expect(await entriesIn(9, 2026)).toHaveLength(0);
  });

  test('preenche meses sem registro pra corrente não quebrar', async () => {
    setToday('2026-11-05T12:00:00-03:00');
    await FinanceMonth.create({ month: 8, year: 2026, team: 'principal' });
    await fixedEntry();

    await ensureCurrentMonth('principal');

    expect(await entriesIn(9, 2026)).toHaveLength(1);
    expect(await entriesIn(10, 2026)).toHaveLength(1);
    expect(await entriesIn(11, 2026)).toHaveLength(1);
    expect(await FinanceMonth.countDocuments({ team: 'principal' })).toBe(4);
  });

  test('não copia despesas únicas', async () => {
    setToday('2026-09-10T12:00:00-03:00');
    await FinanceMonth.create({ month: 8, year: 2026, team: 'principal' });
    await fixedEntry({ nature: 'unica' });

    await ensureCurrentMonth('principal');

    expect(await entriesIn(9, 2026)).toHaveLength(0);
  });

  test('traz de volta um fixo cuja corrente quebrou meses atrás', async () => {
    setToday('2026-09-10T12:00:00-03:00');
    await FinanceMonth.create({ month: 6, year: 2026, team: 'principal' });
    await FinanceMonth.create({ month: 7, year: 2026, team: 'principal' });
    await FinanceMonth.create({ month: 8, year: 2026, team: 'principal' });
    await FinanceMonth.create({ month: 9, year: 2026, team: 'principal' });
    await fixedEntry({ date: new Date(2026, 5, 20) });

    await ensureCurrentMonth('principal');

    const setembro = await entriesIn(9, 2026);
    expect(setembro).toHaveLength(1);
    expect(setembro[0].date.getDate()).toBe(20);
    expect(await entriesIn(8, 2026)).toHaveLength(0);
  });

  test('não traz de volta quando a última ocorrência deixou de ser fixa', async () => {
    setToday('2026-09-10T12:00:00-03:00');
    await FinanceMonth.create({ month: 8, year: 2026, team: 'principal' });
    const raiz = await fixedEntry({ date: new Date(2026, 6, 15) });
    await fixedEntry({ nature: 'unica', recurringRootId: raiz._id });

    await ensureCurrentMonth('principal');

    expect(await entriesIn(9, 2026)).toHaveLength(0);
  });

  test('não traz de volta um fixo apagado num mês posterior', async () => {
    setToday('2026-10-10T12:00:00-03:00');
    const raiz = await fixedEntry();
    await FinanceMonth.create({ month: 8, year: 2026, team: 'principal' });
    await FinanceMonth.create({ month: 9, year: 2026, team: 'principal', generatedSeries: [raiz._id] });

    await ensureCurrentMonth('principal');

    expect(await entriesIn(10, 2026)).toHaveLength(0);
  });
});
