const FinanceGoal = require('../models/FinanceGoal');

async function list(req, res) {
  const goals = await FinanceGoal.find().sort({ createdAt: -1 });
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

  const goal = await FinanceGoal.findByIdAndUpdate(
    req.params.id,
    { name, type, targetAmount, currentAmount, totalInstallments, paidInstallments, installmentAmount, notes, status },
    { new: true, runValidators: true }
  );

  if (!goal) {
    return res.status(404).json({ message: 'Objetivo não encontrado' });
  }

  res.json(goal);
}

async function remove(req, res) {
  const goal = await FinanceGoal.findByIdAndDelete(req.params.id);

  if (!goal) {
    return res.status(404).json({ message: 'Objetivo não encontrado' });
  }

  res.status(204).send();
}

module.exports = { list, create, update, remove };
