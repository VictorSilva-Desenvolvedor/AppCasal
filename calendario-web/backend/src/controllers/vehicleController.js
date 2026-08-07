const Vehicle = require('../models/Vehicle');
const VehicleMaintenance = require('../models/VehicleMaintenance');
const VehiclePayment = require('../models/VehiclePayment');
const { notifyPartner } = require('../services/notificationService');
const { logActivity } = require('../services/activityLogger');

async function list(req, res) {
  const { includeArchived } = req.query;
  const filter = { team: req.userTeam };
  if (!includeArchived) filter.archived = false;

  const vehicles = await Vehicle.find(filter).sort({ createdAt: 1 });
  res.json(vehicles);
}

async function create(req, res) {
  const { name, brand, model, plate, year, color, photoUrl, currentOdometer, purchaseDate, notes } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Nome do veículo é obrigatório' });
  }

  const vehicle = await Vehicle.create({
    name,
    brand: brand || '',
    model: model || '',
    plate: plate || '',
    year: year ?? null,
    color: color || '',
    photoUrl: photoUrl || '',
    currentOdometer: currentOdometer ?? 0,
    purchaseDate: purchaseDate || null,
    notes: notes || '',
    creator: req.userId,
    team: req.userTeam,
  });

  await logActivity({
    actor: req.userId,
    action: 'created',
    module: 'veiculo',
    item: vehicle,
    itemTitle: vehicle.name,
    team: req.userTeam,
  });

  res.status(201).json(vehicle);

  notifyPartner({
    actorId: req.userId,
    title: 'Novo veículo cadastrado',
    body: `🏍️ "${vehicle.name}" foi adicionado aos veículos.`,
    link: '/app/veiculos',
    category: 'veiculos',
  }).catch((err) => console.error('Falha ao notificar novo veículo:', err.message));
}

const ODOMETER_HISTORY_LIMIT = 15;

async function update(req, res) {
  const { name, brand, model, plate, year, color, photoUrl, currentOdometer, purchaseDate, notes, archived } =
    req.body;

  const vehicle = await Vehicle.findOne({ _id: req.params.id, team: req.userTeam });
  if (!vehicle) return res.status(404).json({ message: 'Veículo não encontrado' });

  if (name !== undefined) vehicle.name = name;
  if (brand !== undefined) vehicle.brand = brand;
  if (model !== undefined) vehicle.model = model;
  if (plate !== undefined) vehicle.plate = plate;
  if (year !== undefined) vehicle.year = year;
  if (color !== undefined) vehicle.color = color;
  if (photoUrl !== undefined) vehicle.photoUrl = photoUrl;
  if (purchaseDate !== undefined) vehicle.purchaseDate = purchaseDate;
  if (notes !== undefined) vehicle.notes = notes;
  if (archived !== undefined) vehicle.archived = archived;

  // Qualquer mudança de odômetro (subindo ou descendo — corrigir um erro de
  // digitação é um caso legítimo) guarda o valor anterior no histórico antes
  // de trocar, pra dar pra reverter depois.
  if (currentOdometer !== undefined && currentOdometer !== vehicle.currentOdometer) {
    vehicle.odometerHistory.unshift({ value: vehicle.currentOdometer, changedAt: new Date() });
    vehicle.odometerHistory = vehicle.odometerHistory.slice(0, ODOMETER_HISTORY_LIMIT);
    vehicle.currentOdometer = currentOdometer;
  }

  await vehicle.save();

  await logActivity({
    actor: req.userId,
    action: 'updated',
    module: 'veiculo',
    item: vehicle,
    itemTitle: vehicle.name,
    team: req.userTeam,
  });

  res.json(vehicle);
}

async function remove(req, res) {
  const vehicle = await Vehicle.findOneAndDelete({ _id: req.params.id, team: req.userTeam });
  if (!vehicle) return res.status(404).json({ message: 'Veículo não encontrado' });

  // Manutenções e pagamentos órfãos de um veículo excluído não fazem sentido — remove junto.
  await Promise.all([
    VehicleMaintenance.deleteMany({ vehicle: vehicle._id }),
    VehiclePayment.deleteMany({ vehicle: vehicle._id }),
  ]);

  await logActivity({
    actor: req.userId,
    action: 'deleted',
    module: 'veiculo',
    itemTitle: vehicle.name,
    team: req.userTeam,
  });

  res.status(204).send();
}

module.exports = { list, create, update, remove };
