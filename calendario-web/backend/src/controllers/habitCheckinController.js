const HabitCheckin = require('../models/HabitCheckin');
const Habit = require('../models/Habit');
const User = require('../models/User');
const { notifyPartnerNudge, notifyCollaborativeNudge } = require('../services/habitNudgeService');
const { notifyPartner } = require('../services/notificationService');
const { todayKeyInTimezone, addDaysToKey } = require('../utils/dayKey');

const POPULATE = [
  { path: 'user', select: 'name' },
  { path: 'reactions.user', select: 'name' },
];

async function list(req, res) {
  const { habit, user, day } = req.query;
  const filter = { team: req.userTeam };
  if (habit) filter.habit = habit;
  if (user) filter.user = user;
  if (day) filter.day = day;

  const checkins = await HabitCheckin.find(filter).populate(POPULATE).sort({ day: 1 });
  res.json(checkins);
}

async function create(req, res) {
  const { habit: habitId, day, note, emoji, subtask, value } = req.body;

  if (!habitId || !day) {
    return res.status(400).json({ message: 'Hábito e dia são obrigatórios' });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return res.status(400).json({ message: 'Dia inválido' });
  }

  // Check-in retroativo: só hoje ou ontem (ver suposição declarada no plano).
  const todayKey = todayKeyInTimezone();
  const minDay = addDaysToKey(todayKey, -1);
  if (day > todayKey) {
    return res.status(400).json({ message: 'Não é possível fazer check-in de um dia futuro' });
  }
  if (day < minDay) {
    return res.status(400).json({ message: 'Check-in retroativo só é permitido para hoje ou ontem' });
  }

  const habit = await Habit.findById(habitId);
  if (!habit || !habit.active || String(habit.team) !== req.userTeam) {
    return res.status(404).json({ message: 'Hábito não encontrado' });
  }
  if (habit.type === 'individual' && String(habit.owner) !== req.userId) {
    const err = new Error('Este hábito individual não é seu');
    err.status = 403;
    throw err;
  }
  if (habit.type === 'alternado' && String(habit.currentTurnUserId) !== req.userId) {
    const err = new Error('Não é sua vez neste hábito');
    err.status = 403;
    throw err;
  }

  let subtaskId = null;
  if (habit.type === 'colaborativo') {
    const matchedSubtask = habit.subtasks.find((s) => s.active && String(s._id) === subtask);
    if (!matchedSubtask) {
      return res.status(400).json({ message: 'Subtarefa inválida' });
    }
    subtaskId = matchedSubtask._id;
    const existing = await HabitCheckin.exists({ habit: habitId, day, subtask: subtaskId });
    if (existing) {
      return res.status(409).json({ message: 'Essa subtarefa já foi concluída nesse dia' });
    }
  } else if (habit.goalType === 'quantitativo') {
    if (!value || value <= 0) {
      return res.status(400).json({ message: 'Informe uma quantidade maior que zero' });
    }
    // Múltiplos lançamentos no mesmo dia são permitidos e somados na leitura
    // (ver HabitCheckin.js) — sem checagem de duplicidade aqui.
  } else {
    const existing = await HabitCheckin.exists({ habit: habitId, user: req.userId, day, subtask: null });
    if (existing) {
      return res.status(409).json({ message: 'Você já fez check-in nesse dia' });
    }
  }

  const checkin = await HabitCheckin.create({
    habit: habitId,
    day,
    note: note || '',
    emoji: emoji || '',
    user: req.userId,
    subtask: subtaskId,
    value: habit.goalType === 'quantitativo' ? value : null,
    team: req.userTeam,
  });

  if (habit.type === 'alternado') {
    const otherUser = await User.findOne({ _id: { $ne: req.userId }, includeInHabits: true, team: habit.team });
    if (otherUser) {
      await Habit.updateOne({ _id: habit._id }, { currentTurnUserId: otherUser._id });
    }
  }

  const populated = await checkin.populate(POPULATE);
  res.status(201).json(populated);

  if (['casal', 'espelhado'].includes(habit.type)) {
    notifyPartnerNudge(checkin, habit).catch((err) => console.error('Falha ao notificar parceiro:', err.message));
  } else if (habit.type === 'colaborativo') {
    notifyCollaborativeNudge(checkin, habit).catch((err) => console.error('Falha ao notificar parceiro:', err.message));
  }
}

async function remove(req, res) {
  const checkin = await HabitCheckin.findById(req.params.id);
  if (!checkin || String(checkin.team) !== req.userTeam) return res.status(404).json({ message: 'Check-in não encontrado' });
  if (String(checkin.user) !== req.userId) {
    const err = new Error('Você só pode excluir seus próprios check-ins');
    err.status = 403;
    throw err;
  }

  await HabitCheckin.findByIdAndDelete(checkin._id);
  res.status(204).send();

  Habit.findById(checkin.habit, 'name')
    .then((habit) =>
      notifyPartner({
        actorId: req.userId,
        title: 'Check-in removido',
        body: `🎯 Um check-in do hábito "${habit?.name || ''}" foi removido.`,
        link: '/app/habitos',
        category: 'habit',
      })
    )
    .catch((err) => console.error('Falha ao notificar remoção de check-in:', err.message));
}

async function setReaction(req, res) {
  const { emoji } = req.body;
  if (!emoji) return res.status(400).json({ message: 'Emoji é obrigatório' });

  const checkin = await HabitCheckin.findById(req.params.id);
  if (!checkin || String(checkin.team) !== req.userTeam) return res.status(404).json({ message: 'Check-in não encontrado' });
  if (String(checkin.user) === req.userId) {
    const err = new Error('Você não pode reagir ao seu próprio check-in');
    err.status = 403;
    throw err;
  }

  const checkinUserId = checkin.user;
  checkin.reactions = checkin.reactions.filter((r) => String(r.user) !== req.userId);
  checkin.reactions.push({ user: req.userId, emoji });
  await checkin.save();
  const populated = await checkin.populate(POPULATE);
  res.json(populated);

  notifyPartner({
    actorId: req.userId,
    recipientId: checkinUserId,
    title: 'Nova reação',
    body: `${emoji} Seu parceiro reagiu ao seu check-in.`,
    link: '/app/habitos',
    category: 'habit',
  }).catch((err) => console.error('Falha ao notificar reação:', err.message));
}

async function removeReaction(req, res) {
  const checkin = await HabitCheckin.findById(req.params.id);
  if (!checkin || String(checkin.team) !== req.userTeam) return res.status(404).json({ message: 'Check-in não encontrado' });

  const checkinUserId = checkin.user;
  checkin.reactions = checkin.reactions.filter((r) => String(r.user) !== req.userId);
  await checkin.save();
  const populated = await checkin.populate(POPULATE);
  res.json(populated);

  notifyPartner({
    actorId: req.userId,
    recipientId: checkinUserId,
    title: 'Reação removida',
    body: 'Seu parceiro removeu a reação de um check-in.',
    link: '/app/habitos',
    category: 'habit',
  }).catch((err) => console.error('Falha ao notificar remoção de reação:', err.message));
}

module.exports = { list, create, remove, setReaction, removeReaction };
