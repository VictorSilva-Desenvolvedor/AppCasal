const FinanceGoal = require('../models/FinanceGoal');
const { notifyPartner } = require('../services/notificationService');
const { logActivity } = require('../services/activityLogger');
const { deriveInstallmentAmount } = require('../services/financeGoalUtils');

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
    installmentAmount: deriveInstallmentAmount(targetAmount, totalInstallments, installmentAmount),
    notes: notes || '',
    creator: req.userId,
    team: req.userTeam,
  });
  await goal.populate('creator', 'name');

  await logActivity({
    actor: req.userId,
    action: 'created',
    module: 'financeiro',
    item: goal,
    itemTitle: goal.name,
    details: `Meta: R$ ${Number(goal.targetAmount).toFixed(2)}`,
    team: req.userTeam,
  });

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
    archivedUntil,
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

  const resolvedTargetAmount = targetAmount !== undefined ? targetAmount : before.targetAmount;
  const resolvedTotalInstallments = totalInstallments !== undefined ? totalInstallments : before.totalInstallments;
  const resolvedInstallmentAmount = installmentAmount !== undefined ? installmentAmount : before.installmentAmount;

  const goal = await FinanceGoal.findByIdAndUpdate(
    req.params.id,
    {
      name,
      type,
      targetAmount,
      currentAmount,
      totalInstallments,
      paidInstallments,
      installmentAmount: deriveInstallmentAmount(resolvedTargetAmount, resolvedTotalInstallments, resolvedInstallmentAmount),
      notes,
      status,
      archivedUntil,
    },
    { new: true, runValidators: true }
  ).populate('creator', 'name');

  await logActivity({
    actor: req.userId,
    action: 'updated',
    module: 'financeiro',
    item: goal,
    itemTitle: goal.name,
    details: 'Objetivo atualizado',
    team: req.userTeam,
  });

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

  await logActivity({
    actor: req.userId,
    action: 'deleted',
    module: 'financeiro',
    itemTitle: goal.name,
    team: req.userTeam,
  });

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
