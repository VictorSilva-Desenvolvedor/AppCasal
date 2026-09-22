const FinanceMonth = require('../models/FinanceMonth');
const { notifyPartner } = require('../services/notificationService');
const { generateForNewMonth } = require('../services/recurringFixedExpenses');

// Máximo de meses sem registro que são preenchidos de uma vez (evita laço
// longo se o time ficou muito tempo sem abrir o Financeiro).
const MAX_BACKFILL_MONTHS = 12;

function currentMonthInSaoPaulo() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: 'numeric' })
    .formatToParts(new Date());
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  return { month: get('month'), year: get('year') };
}

function previousMonth({ month, year }) {
  return month === 1 ? { month: 12, year: year - 1 } : { month: month - 1, year };
}

async function ensureMonth(month, year, team) {
  let record = await FinanceMonth.findOne({ month, year, team });
  if (!record) {
    try {
      record = await FinanceMonth.create({ month, year, team });
    } catch (err) {
      if (err.code !== 11000) throw err;
      record = await FinanceMonth.findOne({ month, year, team });
    }
  }
  const generated = await generateForNewMonth(month, year, team, record.generatedSeries);
  if (generated.length) {
    record = await FinanceMonth.findByIdAndUpdate(
      record._id,
      { $addToSet: { generatedSeries: { $each: generated } } },
      { new: true }
    );
  }
  return record;
}

// Garante o mês atual e preenche meses sem registro entre o último existente e
// o atual, em ordem, pra que as despesas fixas sigam a corrente mês a mês.
async function ensureCurrentMonth(team) {
  const current = currentMonthInSaoPaulo();
  const latest = await FinanceMonth.findOne({ team }).sort({ year: -1, month: -1 });

  const pending = [current];
  if (latest) {
    let cursor = previousMonth(current);
    while (
      pending.length < MAX_BACKFILL_MONTHS &&
      (cursor.year > latest.year || (cursor.year === latest.year && cursor.month > latest.month))
    ) {
      pending.unshift(cursor);
      cursor = previousMonth(cursor);
    }
  }

  let record;
  for (const { month, year } of pending) record = await ensureMonth(month, year, team);
  return record;
}

async function list(req, res) {
  await ensureCurrentMonth(req.userTeam);
  const months = await FinanceMonth.find({ team: req.userTeam }).populate('closedBy', 'name').sort({ year: -1, month: -1 });
  res.json(months);
}

async function create(req, res) {
  const { month, year } = req.body;

  if (!month || !year) {
    return res.status(400).json({ message: 'Mês e ano são obrigatórios' });
  }

  const record = await FinanceMonth.create({ month, year, team: req.userTeam });
  res.status(201).json(record);

  notifyPartner({
    actorId: req.userId,
    title: 'Novo mês financeiro',
    body: `💰 O mês ${record.month}/${record.year} foi criado.`,
    link: '/app/financeiro',
    category: 'finance',
  }).catch((err) => console.error('Falha ao notificar criação de mês:', err.message));
}

async function close(req, res) {
  const record = await FinanceMonth.findOneAndUpdate(
    { _id: req.params.id, team: req.userTeam },
    { status: 'fechado', closedAt: new Date(), closedBy: req.userId },
    { new: true }
  ).populate('closedBy', 'name');

  if (!record) {
    return res.status(404).json({ message: 'Mês não encontrado' });
  }

  res.json(record);

  notifyPartner({
    actorId: req.userId,
    title: 'Mês financeiro fechado',
    body: `💰 O mês ${record.month}/${record.year} foi fechado.`,
    link: '/app/financeiro',
    category: 'finance',
  }).catch((err) => console.error('Falha ao notificar fechamento de mês:', err.message));
}

async function reopen(req, res) {
  const record = await FinanceMonth.findOneAndUpdate(
    { _id: req.params.id, team: req.userTeam },
    { status: 'aberto', closedAt: null, closedBy: null },
    { new: true }
  );

  if (!record) {
    return res.status(404).json({ message: 'Mês não encontrado' });
  }

  res.json(record);

  notifyPartner({
    actorId: req.userId,
    title: 'Mês financeiro reaberto',
    body: `💰 O mês ${record.month}/${record.year} foi reaberto.`,
    link: '/app/financeiro',
    category: 'finance',
  }).catch((err) => console.error('Falha ao notificar reabertura de mês:', err.message));
}

module.exports = { list, create, close, reopen, ensureCurrentMonth };
