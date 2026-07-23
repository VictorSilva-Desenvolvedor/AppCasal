const FinanceGoal = require('../models/FinanceGoal');
const { notifyPartner } = require('../services/notificationService');

async function list(req, res) {
  const { creator } = req.query;
  const filter = creator ? { creator, team: req.userTeam } : { team: req.userTeam };

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
    team: req.userTeam,
  });
  await goal.populate('creator', 'name');

  res.status(201).json(goal);

  notifyPartner({
    actorId: req.userId,
    title: 'Novo objetivo financeiro',
    body: `🎯 Novo objetivo criado: "${goal.name}".`,
    link: '/app/financeiro',
    category: 'finance',
  }).catch((err) => console.error('Falha ao notificar objetivo financeiro:', err.message));
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
  if (!before || String(before.team) !== req.userTeam) {
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

  notifyPartner({
    actorId: req.userId,
    title: 'Objetivo financeiro atualizado',
    body: `🎯 O objetivo "${goal.name}" foi atualizado.`,
    link: '/app/financeiro',
    category: 'finance',
  }).catch((err) => console.error('Falha ao notificar atualização de objetivo:', err.message));
}

async function remove(req, res) {
  const goal = await FinanceGoal.findById(req.params.id);

  if (!goal || String(goal.team) !== req.userTeam) {
    return res.status(404).json({ message: 'Objetivo não encontrado' });
  }
  if (String(goal.creator) !== req.userId) {
    const err = new Error('Você só pode excluir objetivos que você mesmo criou');
    err.status = 403;
    throw err;
  }

  await FinanceGoal.findByIdAndDelete(req.params.id);

  res.status(204).send();

  notifyPartner({
    actorId: req.userId,
    title: 'Objetivo financeiro removido',
    body: `🎯 O objetivo "${goal.name}" foi removido.`,
    link: '/app/financeiro',
    category: 'finance',
  }).catch((err) => console.error('Falha ao notificar remoção de objetivo:', err.message));
}

module.exports = { list, create, update, remove };
