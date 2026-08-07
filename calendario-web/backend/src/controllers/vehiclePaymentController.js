const VehiclePayment = require('../models/VehiclePayment');
const Vehicle = require('../models/Vehicle');
const { notifyPartner } = require('../services/notificationService');
const { logActivity } = require('../services/activityLogger');

const CATEGORIES = ['financiamento', 'ipva', 'seguro', 'outros'];

async function list(req, res) {
  const { vehicle, status } = req.query;
  const filter = { team: req.userTeam };
  if (vehicle) filter.vehicle = vehicle;
  if (status) filter.status = status;

  const items = await VehiclePayment.find(filter).sort({ dueDate: 1 });
  res.json(items);
}

async function create(req, res) {
  const { vehicle, description, category, amount, dueDate } = req.body;

  if (!vehicle || !description || amount == null || !dueDate) {
    return res.status(400).json({ message: 'Veículo, descrição, valor e vencimento são obrigatórios' });
  }
  if (category && !CATEGORIES.includes(category)) {
    return res.status(400).json({ message: 'Categoria inválida' });
  }

  const owningVehicle = await Vehicle.findOne({ _id: vehicle, team: req.userTeam });
  if (!owningVehicle) return res.status(404).json({ message: 'Veículo não encontrado' });

  const item = await VehiclePayment.create({
    vehicle,
    description,
    category: category || 'outros',
    amount,
    dueDate,
    creator: req.userId,
    team: req.userTeam,
  });

  await logActivity({
    actor: req.userId,
    action: 'created',
    module: 'veiculo',
    item,
    itemTitle: item.description,
    team: req.userTeam,
  });

  res.status(201).json(item);

  notifyPartner({
    actorId: req.userId,
    title: 'Novo pagamento de veículo',
    body: `💳 "${item.description}" foi adicionado em ${owningVehicle.name}.`,
    link: '/app/veiculos',
    category: 'veiculos',
  }).catch((err) => console.error('Falha ao notificar pagamento de veículo:', err.message));
}

async function update(req, res) {
  const { description, category, amount, dueDate } = req.body;
  const changes = {};
  if (description !== undefined) changes.description = description;
  if (category !== undefined) changes.category = category;
  if (amount !== undefined) changes.amount = amount;
  if (dueDate !== undefined) changes.dueDate = dueDate;

  const existing = await VehiclePayment.findOne({ _id: req.params.id, team: req.userTeam });
  if (!existing) return res.status(404).json({ message: 'Pagamento não encontrado' });

  const item = await VehiclePayment.findByIdAndUpdate(req.params.id, changes, {
    new: true,
    runValidators: true,
  });

  await logActivity({
    actor: req.userId,
    action: 'updated',
    module: 'veiculo',
    item,
    itemTitle: item.description,
    team: req.userTeam,
  });

  res.json(item);
}

async function pay(req, res) {
  const item = await VehiclePayment.findOne({ _id: req.params.id, team: req.userTeam });
  if (!item) return res.status(404).json({ message: 'Pagamento não encontrado' });

  item.status = 'pago';
  item.paidAt = new Date();
  await item.save();

  await logActivity({
    actor: req.userId,
    action: 'updated',
    module: 'veiculo',
    item,
    itemTitle: item.description,
    details: 'Pagamento marcado como pago',
    team: req.userTeam,
  });

  res.json(item);

  notifyPartner({
    actorId: req.userId,
    title: 'Pagamento de veículo quitado',
    body: `✅ "${item.description}" foi marcado como pago.`,
    link: '/app/veiculos',
    category: 'veiculos',
  }).catch((err) => console.error('Falha ao notificar pagamento quitado:', err.message));
}

async function remove(req, res) {
  const item = await VehiclePayment.findOneAndDelete({ _id: req.params.id, team: req.userTeam });
  if (!item) return res.status(404).json({ message: 'Pagamento não encontrado' });

  await logActivity({
    actor: req.userId,
    action: 'deleted',
    module: 'veiculo',
    itemTitle: item.description,
    team: req.userTeam,
  });

  res.status(204).send();
}

module.exports = { list, create, update, pay, remove };
