const FinanceGoal = require('../models/FinanceGoal');

async function list(req, res) {
  const { creator } = req.query;
  const filter = creator ? { creator } : {};

  const goals = await FinanceGoal.find(filter).populate('creator', 'name').sort({ createdAt: -1 });
  res.json(goals);
}

async function create(req, res) {
  const { name, type, targetAmount, currentAmount, totalInstallments, paidInstallments, installmentAmount, notes } =
    req.body;

  if (!name || targetAmount === undefined) {
    return res.status(400).json({ message: 'Nome e valor alvo são obrigatórios' });
  }

  const goal = await FinanceGoal.create({
    name,
    type: type || 'poupanca',
    targetAmount,
    currentAmount: currentAmount || 0,
    totalInstallments: totalInstallments || null,
    paidInstallments: paidInstallments || 0,
    installmentAmount: installmentAmount || null,
    notes: notes || '',
    creator: req.userId,
  });
  await goal.populate('creator', 'name');

  res.status(201).json(goal);
}

async function update(req, res) {
  const {
    name,
    type,
    targetAmount,
    currentAmount,
    totalInstallments,
    paidInstallments,
    installmentAmount,
    notes,
    status,
  } = req.body;

  const before = await FinanceGoal.findById(req.params.id);
  if (!before) {
    return res.status(404).json({ message: 'Objetivo não encontrado' });
  }
  if (String(before.creator) !== req.userId) {
    const err = new Error('Você só pode editar objetivos que você mesmo criou');
    err.status = 403;
    throw err;
  }

  const goal = await FinanceGoal.findByIdAndUpdate(
    req.params.id,
    { name, type, targetAmount, currentAmount, totalInstallments, paidInstallments, installmentAmount, notes, status },
    { new: true, runValidators: true }
  ).populate('creator', 'name');

  res.json(goal);
}

async function remove(req, res) {
  const goal = await FinanceGoal.findById(req.params.id);

  if (!goal) {
    return res.status(404).json({ message: 'Objetivo não encontrado' });
  }
  if (String(goal.creator) !== req.userId) {
    const err = new Error('Você só pode excluir objetivos que você mesmo criou');
    err.status = 403;
    throw err;
  }

  await FinanceGoal.findByIdAndDelete(req.params.id);

  res.status(204).send();
}

module.exports = { list, create, update, remove };
