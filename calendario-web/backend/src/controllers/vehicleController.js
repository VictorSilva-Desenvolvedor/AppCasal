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

async function update(req, res) {
  const { name, brand, model, plate, year, color, photoUrl, currentOdometer, purchaseDate, notes, archived } =
    req.body;
  const changes = {};
  if (name !== undefined) changes.name = name;
  if (brand !== undefined) changes.brand = brand;
  if (model !== undefined) changes.model = model;
  if (plate !== undefined) changes.plate = plate;
  if (year !== undefined) changes.year = year;
  if (color !== undefined) changes.color = color;
  if (photoUrl !== undefined) changes.photoUrl = photoUrl;
  if (currentOdometer !== undefined) changes.currentOdometer = currentOdometer;
  if (purchaseDate !== undefined) changes.purchaseDate = purchaseDate;
  if (notes !== undefined) changes.notes = notes;
  if (archived !== undefined) changes.archived = archived;

  const existing = await Vehicle.findOne({ _id: req.params.id, team: req.userTeam });
  if (!existing) return res.status(404).json({ message: 'Veículo não encontrado' });

  const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, changes, {
    new: true,
    runValidators: true,
  });

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
