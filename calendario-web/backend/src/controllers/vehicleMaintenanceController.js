const VehicleMaintenance = require('../models/VehicleMaintenance');
const Vehicle = require('../models/Vehicle');
const { notifyPartner } = require('../services/notificationService');
const { logActivity } = require('../services/activityLogger');
const PRESETS = require('../data/vehicleMaintenancePresets');

const CATEGORIES = ['oleo', 'revisao', 'pneus', 'freios', 'outros'];
const DAY_MS = 24 * 60 * 60 * 1000;

async function list(req, res) {
  const { vehicle, status } = req.query;
  const filter = { team: req.userTeam };
  if (vehicle) filter.vehicle = vehicle;
  if (status) filter.status = status;

  const items = await VehicleMaintenance.find(filter).sort({ dueDate: 1, dueOdometer: 1 });
  res.json(items);
}

async function create(req, res) {
  const { vehicle, title, category, dueDate, dueOdometer, cost, notes, recurrenceDays, recurrenceKm } = req.body;

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
    recurrenceDays: recurrenceDays ?? null,
    recurrenceKm: recurrenceKm ?? null,
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
  const { title, category, dueDate, dueOdometer, cost, notes, recurrenceDays, recurrenceKm } = req.body;
  const changes = {};
  if (title !== undefined) changes.title = title;
  if (category !== undefined) changes.category = category;
  if (dueDate !== undefined) changes.dueDate = dueDate;
  if (dueOdometer !== undefined) changes.dueOdometer = dueOdometer;
  if (cost !== undefined) changes.cost = cost;
  if (notes !== undefined) changes.notes = notes;
  if (recurrenceDays !== undefined) changes.recurrenceDays = recurrenceDays;
  if (recurrenceKm !== undefined) changes.recurrenceKm = recurrenceKm;

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
  const { completedOdometer, notes } = req.body;

  const item = await VehicleMaintenance.findOne({ _id: req.params.id, team: req.userTeam });
  if (!item) return res.status(404).json({ message: 'Manutenção não encontrada' });

  // Guarda a nota "de tarefa" original (separado da observação de conclusão
  // abaixo) pra usar no clone da próxima ocorrência recorrente — a observação
  // é sobre o que aconteceu desta vez, não deve virar template pra sempre.
  const taskNotes = item.notes;

  item.status = 'concluido';
  item.completedAt = new Date();
  item.completedOdometer = completedOdometer ?? null;
  if (notes) {
    item.notes = taskNotes ? `${taskNotes}\n\n${notes}` : notes;
  }
  await item.save();

  // Concluir uma manutenção é a forma mais comum do usuário informar o km
  // atual — atualiza o odômetro do veículo se o valor informado for maior,
  // guardando o valor anterior no histórico (mesmo mecanismo de reverter do
  // vehicleController#update).
  if (completedOdometer != null) {
    const owningVehicle = await Vehicle.findOne({ _id: item.vehicle, team: req.userTeam });
    if (owningVehicle && completedOdometer > owningVehicle.currentOdometer) {
      owningVehicle.odometerHistory.unshift({ value: owningVehicle.currentOdometer, changedAt: new Date() });
      owningVehicle.odometerHistory = owningVehicle.odometerHistory.slice(0, 15);
      owningVehicle.currentOdometer = completedOdometer;
      await owningVehicle.save();
    }
  }

  // Item recorrente (ex.: "calibrar pneu toda semana", "trocar óleo a cada
  // 3000km) — gera a próxima ocorrência pendente já na conclusão, clonando
  // os dados do item.
  if (item.recurrenceDays != null || item.recurrenceKm != null) {
    const baseOdometer = completedOdometer ?? (await Vehicle.findById(item.vehicle))?.currentOdometer ?? 0;
    await VehicleMaintenance.create({
      vehicle: item.vehicle,
      title: item.title,
      category: item.category,
      notes: taskNotes,
      dueDate: item.recurrenceDays != null ? new Date(item.completedAt.getTime() + item.recurrenceDays * DAY_MS) : null,
      dueOdometer: item.recurrenceKm != null ? baseOdometer + item.recurrenceKm : null,
      recurrenceDays: item.recurrenceDays,
      recurrenceKm: item.recurrenceKm,
      creator: req.userId,
      team: req.userTeam,
    });
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

async function applyPreset(req, res) {
  const { vehicle, preset } = req.body;

  const presetDef = PRESETS[preset];
  if (!presetDef) return res.status(400).json({ message: 'Checklist padrão desconhecido' });

  const owningVehicle = await Vehicle.findOne({ _id: vehicle, team: req.userTeam });
  if (!owningVehicle) return res.status(404).json({ message: 'Veículo não encontrado' });

  // O checklist pode vir com uma foto padrão do modelo — só aplica se o
  // veículo ainda não tiver foto própria, pra não sobrescrever uma foto real
  // que o usuário já tenha enviado.
  if (presetDef.photoUrl && !owningVehicle.photoUrl) {
    owningVehicle.photoUrl = presetDef.photoUrl;
    await owningVehicle.save();
  }

  const existingTitles = new Set(
    (await VehicleMaintenance.find({ vehicle, team: req.userTeam, status: 'pendente' }, 'title')).map((i) => i.title)
  );

  const toCreate = presetDef.items.filter((presetItem) => !existingTitles.has(presetItem.title));
  const skipped = presetDef.items.filter((presetItem) => existingTitles.has(presetItem.title)).map((i) => i.title);

  const created = await VehicleMaintenance.insertMany(
    toCreate.map((presetItem) => ({
      vehicle,
      title: presetItem.title,
      category: presetItem.category || 'outros',
      notes: presetItem.notes || '',
      dueDate: presetItem.recurrenceDays != null ? new Date(Date.now() + presetItem.recurrenceDays * DAY_MS) : null,
      dueOdometer:
        presetItem.recurrenceKm != null ? owningVehicle.currentOdometer + presetItem.recurrenceKm : null,
      recurrenceDays: presetItem.recurrenceDays ?? null,
      recurrenceKm: presetItem.recurrenceKm ?? null,
      creator: req.userId,
      team: req.userTeam,
    }))
  );

  await logActivity({
    actor: req.userId,
    action: 'created',
    module: 'veiculo',
    itemTitle: presetDef.label,
    details: `Checklist padrão aplicado (${created.length} itens)`,
    team: req.userTeam,
  });

  res.status(201).json({ created, skipped });
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

module.exports = { list, create, update, complete, applyPreset, remove };
