const HabitCheckin = require('../models/HabitCheckin');
const Habit = require('../models/Habit');
const { notifyPartnerNudge } = require('../services/habitNudgeService');

const POPULATE = { path: 'user', select: 'name' };

async function list(req, res) {
  const { habit, user, day } = req.query;
  const filter = {};
  if (habit) filter.habit = habit;
  if (user) filter.user = user;
  if (day) filter.day = day;

  const checkins = await HabitCheckin.find(filter).populate(POPULATE).sort({ day: 1 });
  res.json(checkins);
}

async function create(req, res) {
  const { habit: habitId, day, note, emoji } = req.body;

  if (!habitId || !day) {
    return res.status(400).json({ message: 'Hábito e dia são obrigatórios' });
  }

  const habit = await Habit.findById(habitId);
  if (!habit || !habit.active) {
    return res.status(404).json({ message: 'Hábito não encontrado' });
  }
  if (habit.type === 'individual' && String(habit.owner) !== req.userId) {
    const err = new Error('Este hábito individual não é seu');
    err.status = 403;
    throw err;
  }

  const checkin = await HabitCheckin.create({
    habit: habitId,
    day,
    note: note || '',
    emoji: emoji || '',
    user: req.userId,
  });
  const populated = await checkin.populate(POPULATE);
  res.status(201).json(populated);

  if (habit.type === 'casal') {
    notifyPartnerNudge(checkin, habit).catch((err) => console.error('Falha ao notificar parceiro:', err.message));
  }
}

async function remove(req, res) {
  const checkin = await HabitCheckin.findById(req.params.id);
  if (!checkin) return res.status(404).json({ message: 'Check-in não encontrado' });
  if (String(checkin.user) !== req.userId) {
    const err = new Error('Você só pode excluir seus próprios check-ins');
    err.status = 403;
    throw err;
  }

  await HabitCheckin.findByIdAndDelete(checkin._id);
  res.status(204).send();
}

module.exports = { list, create, remove };
