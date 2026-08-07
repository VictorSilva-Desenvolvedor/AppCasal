const VehicleMaintenance = require('../models/VehicleMaintenance');
const Vehicle = require('../models/Vehicle');
const { notifyPartner } = require('../services/notificationService');
const { logActivity } = require('../services/activityLogger');

const CATEGORIES = ['oleo', 'revisao', 'pneus', 'freios', 'outros'];

async function list(req, res) {
  const { vehicle, status } = req.query;
  const filter = { team: req.userTeam };
  if (vehicle) filter.vehicle = vehicle;
  if (status) filter.status = status;

  const items = await VehicleMaintenance.find(filter).sort({ dueDate: 1, dueOdometer: 1 });
  res.json(items);
}

async function create(req, res) {
  const { vehicle, title, category, dueDate, dueOdometer, cost, notes } = req.body;

  if (!vehicle || !title) {
    return res.status(400).json({ message: 'Veículo e título são obrigatórios' });
  }
  if (category && !CATEGORIES.includes(category)) {
    return res.status(400).json({ message: 'Categoria inválida' });
  }

  const owningVehicle = await Vehicle.findOne({ _id: vehicle, team: req.userTeam });
  if (!owningVehicle) return res.status(404).json({ message: 'Veículo não encontrado' });

  const item = await VehicleMaintenance.create({
    vehicle,
    title,
    category: category || 'outros',
    dueDate: dueDate || null,
    dueOdometer: dueOdometer ?? null,
    cost: cost ?? null,
    notes: notes || '',
    creator: req.userId,
    team: req.userTeam,
  });

  await logActivity({
    actor: req.userId,
    action: 'created',
    module: 'veiculo',
    item,
    itemTitle: item.title,
    team: req.userTeam,
  });

  res.status(201).json(item);

  notifyPartner({
    actorId: req.userId,
    title: 'Nova manutenção agendada',
    body: `🔧 "${item.title}" foi adicionada em ${owningVehicle.name}.`,
    link: '/app/veiculos',
    category: 'veiculos',
  }).catch((err) => console.error('Falha ao notificar manutenção:', err.message));
}

async function update(req, res) {
  const { title, category, dueDate, dueOdometer, cost, notes } = req.body;
  const changes = {};
  if (title !== undefined) changes.title = title;
  if (category !== undefined) changes.category = category;
  if (dueDate !== undefined) changes.dueDate = dueDate;
  if (dueOdometer !== undefined) changes.dueOdometer = dueOdometer;
  if (cost !== undefined) changes.cost = cost;
  if (notes !== undefined) changes.notes = notes;

  const existing = await VehicleMaintenance.findOne({ _id: req.params.id, team: req.userTeam });
  if (!existing) return res.status(404).json({ message: 'Manutenção não encontrada' });

  const item = await VehicleMaintenance.findByIdAndUpdate(req.params.id, changes, {
    new: true,
    runValidators: true,
  });

  await logActivity({
    actor: req.userId,
    action: 'updated',
    module: 'veiculo',
    item,
    itemTitle: item.title,
    team: req.userTeam,
  });

  res.json(item);
}

async function complete(req, res) {
  const { completedOdometer } = req.body;

  const item = await VehicleMaintenance.findOne({ _id: req.params.id, team: req.userTeam });
  if (!item) return res.status(404).json({ message: 'Manutenção não encontrada' });

  item.status = 'concluido';
  item.completedAt = new Date();
  item.completedOdometer = completedOdometer ?? null;
  await item.save();

  // Concluir uma manutenção é a forma mais comum do usuário informar o km
  // atual — atualiza o odômetro do veículo se o valor informado for maior.
  if (completedOdometer != null) {
    await Vehicle.updateOne(
      { _id: item.vehicle, team: req.userTeam, currentOdometer: { $lt: completedOdometer } },
      { $set: { currentOdometer: completedOdometer } }
    );
  }

  await logActivity({
    actor: req.userId,
    action: 'updated',
    module: 'veiculo',
    item,
    itemTitle: item.title,
    details: 'Manutenção concluída',
    team: req.userTeam,
  });

  res.json(item);

  notifyPartner({
    actorId: req.userId,
    title: 'Manutenção concluída',
    body: `✅ "${item.title}" foi marcada como concluída.`,
    link: '/app/veiculos',
    category: 'veiculos',
  }).catch((err) => console.error('Falha ao notificar manutenção concluída:', err.message));
}

async function remove(req, res) {
  const item = await VehicleMaintenance.findOneAndDelete({ _id: req.params.id, team: req.userTeam });
  if (!item) return res.status(404).json({ message: 'Manutenção não encontrada' });

  await logActivity({
    actor: req.userId,
    action: 'deleted',
    module: 'veiculo',
    itemTitle: item.title,
    team: req.userTeam,
  });

  res.status(204).send();
}

module.exports = { list, create, update, complete, remove };
