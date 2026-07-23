const Habit = require('../models/Habit');

const POPULATE = [
  { path: 'createdBy', select: 'name' },
  { path: 'owner', select: 'name' },
];

async function list(req, res) {
  const { type, active } = req.query;
  const filter = {};
  if (type) filter.type = type;

  if (active === 'all') {
    // sem filtro de active
  } else if (active === 'false') {
    filter.active = false;
  } else {
    filter.active = true;
  }

  const habits = await Habit.find(filter).populate(POPULATE).sort({ createdAt: 1 });
  res.json(habits);
}

async function create(req, res) {
  const { name, type, owner, emoji, color, reminderTime } = req.body;

  if (!name || !type) {
    return res.status(400).json({ message: 'Nome e tipo são obrigatórios' });
  }
  if (!['casal', 'individual'].includes(type)) {
    return res.status(400).json({ message: 'Tipo inválido' });
  }
  if (type === 'individual' && !owner) {
    return res.status(400).json({ message: 'Hábitos individuais precisam de um dono' });
  }

  const habit = await Habit.create({
    name,
    type,
    owner: type === 'individual' ? owner : null,
    emoji: emoji || undefined,
    color: color || undefined,
    reminderTime: reminderTime || null,
    createdBy: req.userId,
  });
  const populated = await habit.populate(POPULATE);
  res.status(201).json(populated);
}

async function update(req, res) {
  const habit = await Habit.findById(req.params.id);
  if (!habit) return res.status(404).json({ message: 'Hábito não encontrado' });
  if (String(habit.createdBy) !== req.userId) {
    const err = new Error('Você só pode editar hábitos que você criou');
    err.status = 403;
    throw err;
  }

  const { name, emoji, color, reminderTime, active } = req.body;
  const patch = {};
  if (name !== undefined) patch.name = name;
  if (emoji !== undefined) patch.emoji = emoji;
  if (color !== undefined) patch.color = color;
  if (reminderTime !== undefined) patch.reminderTime = reminderTime;
  if (active !== undefined) patch.active = active;

  const updated = await Habit.findByIdAndUpdate(req.params.id, patch, {
    new: true,
    runValidators: true,
  }).populate(POPULATE);

  res.json(updated);
}

async function archive(req, res) {
  const habit = await Habit.findById(req.params.id);
  if (!habit) return res.status(404).json({ message: 'Hábito não encontrado' });
  if (String(habit.createdBy) !== req.userId) {
    const err = new Error('Você só pode arquivar hábitos que você criou');
    err.status = 403;
    throw err;
  }

  habit.active = false;
  await habit.save();
  await habit.populate(POPULATE);
  res.json(habit);
}

module.exports = { list, create, update, archive };
