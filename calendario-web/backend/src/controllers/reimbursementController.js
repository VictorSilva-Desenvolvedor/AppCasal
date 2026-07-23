const Reimbursement = require('../models/Reimbursement');
const { notifyPartner } = require('../services/notificationService');

const REIMBURSEMENT_POPULATE = [
  { path: 'owedBy', select: 'name' },
  { path: 'owedTo', select: 'name' },
];

async function list(req, res) {
  const reimbursements = await Reimbursement.find({ team: req.userTeam }).populate(REIMBURSEMENT_POPULATE).sort({ createdAt: -1 });
  res.json(reimbursements);
}

async function create(req, res) {
  const { owedBy, owedTo, amount, description } = req.body;

  if (!owedBy || !owedTo || !amount || !description) {
    return res.status(400).json({ message: 'Devedor, credor, valor e descrição são obrigatórios' });
  }

  const reimbursement = await Reimbursement.create({
    owedBy,
    owedTo,
    amount,
    description,
    creator: req.userId,
    team: req.userTeam,
  });
  const populated = await reimbursement.populate(REIMBURSEMENT_POPULATE);
  res.status(201).json(populated);

  notifyPartner({
    actorId: req.userId,
    title: 'Novo reembolso',
    body: `💰 Novo reembolso registrado: "${description}" (R$ ${Number(amount).toFixed(2)}).`,
    link: '/app/financeiro',
    category: 'reimbursement',
  }).catch((err) => console.error('Falha ao notificar reembolso:', err.message));
}

async function settle(req, res) {
  const reimbursement = await Reimbursement.findOneAndUpdate(
    { _id: req.params.id, team: req.userTeam },
    { status: 'quitado', settledAt: new Date() },
    { new: true }
  ).populate(REIMBURSEMENT_POPULATE);

  if (!reimbursement) {
    return res.status(404).json({ message: 'Reembolso não encontrado' });
  }

  res.json(reimbursement);

  notifyPartner({
    actorId: req.userId,
    title: 'Reembolso quitado',
    body: `💰 O reembolso "${reimbursement.description}" foi marcado como quitado.`,
    link: '/app/financeiro',
    category: 'reimbursement',
  }).catch((err) => console.error('Falha ao notificar quitação de reembolso:', err.message));
}

async function remove(req, res) {
  const reimbursement = await Reimbursement.findOneAndDelete({ _id: req.params.id, team: req.userTeam });

  if (!reimbursement) {
    return res.status(404).json({ message: 'Reembolso não encontrado' });
  }

  res.status(204).send();

  notifyPartner({
    actorId: req.userId,
    title: 'Reembolso removido',
    body: `💰 O reembolso "${reimbursement.description}" foi removido.`,
    link: '/app/financeiro',
    category: 'reimbursement',
  }).catch((err) => console.error('Falha ao notificar remoção de reembolso:', err.message));
}

module.exports = { list, create, settle, remove };
