const FinanceMonth = require('../models/FinanceMonth');

async function ensureCurrentMonth() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  let record = await FinanceMonth.findOne({ month, year });
  if (!record) {
    record = await FinanceMonth.create({ month, year });
  }
  return record;
}

async function list(req, res) {
  await ensureCurrentMonth();
  const months = await FinanceMonth.find().populate('closedBy', 'name').sort({ year: -1, month: -1 });
  res.json(months);
}

async function create(req, res) {
  const { month, year } = req.body;

  if (!month || !year) {
    return res.status(400).json({ message: 'Mês e ano são obrigatórios' });
  }

  const record = await FinanceMonth.create({ month, year });
  res.status(201).json(record);
}

async function close(req, res) {
  const record = await FinanceMonth.findByIdAndUpdate(
    req.params.id,
    { status: 'fechado', closedAt: new Date(), closedBy: req.userId },
    { new: true }
  ).populate('closedBy', 'name');

  if (!record) {
    return res.status(404).json({ message: 'Mês não encontrado' });
  }

  res.json(record);
}

async function reopen(req, res) {
  const record = await FinanceMonth.findByIdAndUpdate(
    req.params.id,
    { status: 'aberto', closedAt: null, closedBy: null },
    { new: true }
  );

  if (!record) {
    return res.status(404).json({ message: 'Mês não encontrado' });
  }

  res.json(record);
}

module.exports = { list, create, close, reopen };
