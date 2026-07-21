const FinanceEntry = require('../models/FinanceEntry');
const FinanceMonth = require('../models/FinanceMonth');
const Reimbursement = require('../models/Reimbursement');

const ENTRY_POPULATE = [
  { path: 'category' },
  { path: 'paidBy', select: 'name' },
  { path: 'sharedWith', select: 'name' },
  { path: 'creator', select: 'name' },
];

async function assertMonthOpen(date) {
  const d = new Date(date);
  const month = await FinanceMonth.findOne({ month: d.getMonth() + 1, year: d.getFullYear() });

  if (month && month.status === 'fechado') {
    const err = new Error('Este mês está finalizado — reabra o mês para editar lançamentos');
    err.status = 400;
    throw err;
  }
}

async function syncReimbursement(entry, req) {
  if (!entry.sharedWith || !entry.splitAmount) {
    await Reimbursement.deleteMany({ relatedEntry: entry._id });
    return;
  }

  await Reimbursement.findOneAndUpdate(
    { relatedEntry: entry._id },
    {
      owedBy: entry.sharedWith,
      owedTo: entry.paidBy,
      amount: entry.splitAmount,
      description: `Divisão de "${entry.description}"`,
      relatedEntry: entry._id,
      creator: req.userId,
    },
    { upsert: true, setDefaultsOnInsert: true }
  );
}

async function list(req, res) {
  const { month, year, type, category } = req.query;
  const filter = {};

  if (month && year) {
    const start = new Date(Number(year), Number(month) - 1, 1);
    const end = new Date(Number(year), Number(month), 1);
    filter.date = { $gte: start, $lt: end };
  }
  if (type) filter.type = type;
  if (category) filter.category = category;

  const entries = await FinanceEntry.find(filter).populate(ENTRY_POPULATE).sort({ date: -1 });
  res.json(entries);
}

async function create(req, res) {
  const { type, description, amount, category, date, paidAmount, wishType, reason, sharedWith, splitAmount } =
    req.body;

  if (!type || !description || amount === undefined || !date) {
    return res.status(400).json({ message: 'Tipo, descrição, valor e data são obrigatórios' });
  }
  if (sharedWith && !splitAmount) {
    return res.status(400).json({ message: 'Informe o valor do reembolso ao compartilhar uma despesa' });
  }

  await assertMonthOpen(date);

  const entry = await FinanceEntry.create({
    type,
    description,
    amount,
    category: category || null,
    date,
    paidAmount: paidAmount || 0,
    wishType: wishType || null,
    reason: reason || '',
    paidBy: req.userId,
    sharedWith: sharedWith || null,
    splitAmount: sharedWith ? splitAmount : null,
    creator: req.userId,
  });

  await syncReimbursement(entry, req);

  const populated = await entry.populate(ENTRY_POPULATE);
  res.status(201).json(populated);
}

async function update(req, res) {
  const { type, description, amount, category, date, paidAmount, wishType, reason, sharedWith, splitAmount } =
    req.body;

  const before = await FinanceEntry.findById(req.params.id);
  if (!before) {
    return res.status(404).json({ message: 'Lançamento não encontrado' });
  }
  if (String(before.paidBy) !== req.userId) {
    const err = new Error('Você só pode editar lançamentos que você mesmo pagou');
    err.status = 403;
    throw err;
  }
  if (sharedWith && !splitAmount) {
    return res.status(400).json({ message: 'Informe o valor do reembolso ao compartilhar uma despesa' });
  }

  await assertMonthOpen(before.date);
  if (date !== undefined) await assertMonthOpen(date);

  const entry = await FinanceEntry.findByIdAndUpdate(
    req.params.id,
    {
      type,
      description,
      amount,
      category: category || null,
      date,
      paidAmount,
      wishType: wishType || null,
      reason,
      sharedWith: sharedWith || null,
      splitAmount: sharedWith ? splitAmount : null,
    },
    { new: true, runValidators: true }
  ).populate(ENTRY_POPULATE);

  await syncReimbursement(entry, req);

  res.json(entry);
}

async function remove(req, res) {
  const entry = await FinanceEntry.findById(req.params.id);
  if (!entry) {
    return res.status(404).json({ message: 'Lançamento não encontrado' });
  }
  if (String(entry.paidBy) !== req.userId) {
    const err = new Error('Você só pode excluir lançamentos que você mesmo pagou');
    err.status = 403;
    throw err;
  }

  await assertMonthOpen(entry.date);

  await FinanceEntry.findByIdAndDelete(entry._id);
  await Reimbursement.deleteMany({ relatedEntry: entry._id });

  res.status(204).send();
}

async function report(req, res) {
  const { month, year } = req.query;
  if (!month || !year) {
    return res.status(400).json({ message: 'Mês e ano são obrigatórios' });
  }

  const start = new Date(Number(year), Number(month) - 1, 1);
  const end = new Date(Number(year), Number(month), 1);

  const allEntries = await FinanceEntry.find({ date: { $gte: start, $lt: end } }).populate('category');
  // Itens de planejamento futuro (necessidade/desejo) ainda não são gasto real,
  // então ficam de fora do total/saldo do mês — só aparecem na aba Comodidades.
  const entries = allEntries.filter((e) => !e.wishType);

  const totalReceitas = entries.filter((e) => e.type === 'receita').reduce((sum, e) => sum + e.amount, 0);
  const totalDespesas = entries.filter((e) => e.type === 'despesa').reduce((sum, e) => sum + e.amount, 0);
  const saldo = totalReceitas - totalDespesas;
  const percentualGasto = totalReceitas > 0 ? totalDespesas / totalReceitas : 0;

  const categoryMap = new Map();
  entries
    .filter((e) => e.type === 'despesa')
    .forEach((e) => {
      const cat = e.category;
      const key = cat ? String(cat._id) : 'sem-categoria';
      if (!categoryMap.has(key)) {
        categoryMap.set(key, {
          categoryId: cat ? cat._id : null,
          name: cat ? cat.name : 'Sem categoria',
          color: cat ? cat.color : '#64748b',
          total: 0,
        });
      }
      categoryMap.get(key).total += e.amount;
    });

  res.json({
    totalReceitas,
    totalDespesas,
    saldo,
    percentualGasto,
    porCategoria: Array.from(categoryMap.values()).sort((a, b) => b.total - a.total),
  });
}

module.exports = { list, create, update, remove, report, assertMonthOpen };
