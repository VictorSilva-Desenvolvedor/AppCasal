const FinanceMonth = require('../models/FinanceMonth');
const { notifyPartner } = require('../services/notificationService');
const { generateForNewMonth } = require('../services/recurringFixedExpenses');

async function ensureCurrentMonth(team) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  let record = await FinanceMonth.findOne({ month, year, team });
  if (!record) {
    record = await FinanceMonth.create({ month, year, team });
    await generateForNewMonth(month, year, team);
  }
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

module.exports = { list, create, close, reopen };
