const FinanceCategory = require('../models/FinanceCategory');
const { notifyPartner } = require('../services/notificationService');

async function list(req, res) {
  const categories = await FinanceCategory.find({ team: req.userTeam }).sort({ type: 1, name: 1 });
  res.json(categories);
}

async function create(req, res) {
  const { name, type, color } = req.body;

  if (!name || !type) {
    return res.status(400).json({ message: 'Nome e tipo são obrigatórios' });
  }

  const category = await FinanceCategory.create({ name, type, color, team: req.userTeam });
  res.status(201).json(category);

  notifyPartner({
    actorId: req.userId,
    title: 'Nova categoria financeira',
    body: `💰 Nova categoria criada: "${category.name}".`,
    link: '/app/financeiro',
    category: 'finance',
  }).catch((err) => console.error('Falha ao notificar categoria financeira:', err.message));
}

async function update(req, res) {
  const { name, type, color } = req.body;

  const category = await FinanceCategory.findOneAndUpdate(
    { _id: req.params.id, team: req.userTeam },
    { name, type, color },
    { new: true, runValidators: true }
  );

  if (!category) {
    return res.status(404).json({ message: 'Categoria não encontrada' });
  }

  res.json(category);

  notifyPartner({
    actorId: req.userId,
    title: 'Categoria financeira atualizada',
    body: `💰 A categoria "${category.name}" foi atualizada.`,
    link: '/app/financeiro',
    category: 'finance',
  }).catch((err) => console.error('Falha ao notificar atualização de categoria:', err.message));
}

async function remove(req, res) {
  const category = await FinanceCategory.findOneAndDelete({ _id: req.params.id, team: req.userTeam });

  if (!category) {
    return res.status(404).json({ message: 'Categoria não encontrada' });
  }

  res.status(204).send();

  notifyPartner({
    actorId: req.userId,
    title: 'Categoria financeira removida',
    body: `💰 A categoria "${category.name}" foi removida.`,
    link: '/app/financeiro',
    category: 'finance',
  }).catch((err) => console.error('Falha ao notificar remoção de categoria:', err.message));
}

module.exports = { list, create, update, remove };
