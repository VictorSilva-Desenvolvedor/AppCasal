const Habit = require('../models/Habit');
const { todayKeyInTimezone } = require('../utils/dayKey');
const { notifyPartner } = require('../services/notificationService');

const POPULATE = [
  { path: 'createdBy', select: 'name' },
  { path: 'owner', select: 'name' },
  { path: 'currentTurnUserId', select: 'name' },
];

const TYPES = ['casal', 'individual', 'espelhado', 'alternado', 'colaborativo'];
const QUANTITATIVE_ALLOWED_TYPES = ['casal', 'individual', 'espelhado'];
const FREQUENCY_KINDS = ['diario', 'dias_semana', 'vezes_por_semana', 'quinzenal'];

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
  const {
    name,
    type,
    owner,
    startingUserId,
    subtasks,
    emoji,
    color,
    reminderTime,
    category,
    difficulty,
    frequency,
    durationType,
    challengeDays,
    goalType,
    targetValue,
    unit,
    maxMissesPerWeek,
    freezesPerMonth,
  } = req.body;

  if (!name || !type) {
    return res.status(400).json({ message: 'Nome e tipo são obrigatórios' });
  }
  if (!TYPES.includes(type)) {
    return res.status(400).json({ message: 'Tipo inválido' });
  }
  if (type === 'individual' && !owner) {
    return res.status(400).json({ message: 'Hábitos individuais precisam de um dono' });
  }

  const validSubtasks = Array.isArray(subtasks) ? subtasks.filter((s) => s && s.label && s.label.trim()) : [];
  if (type === 'colaborativo' && validSubtasks.length === 0) {
    return res.status(400).json({ message: 'Hábitos colaborativos precisam de pelo menos uma subtarefa' });
  }

  const resolvedGoalType = goalType === 'quantitativo' ? 'quantitativo' : 'binario';
  if (resolvedGoalType === 'quantitativo') {
    if (!QUANTITATIVE_ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({ message: 'Meta quantitativa não é válida para esse tipo de hábito' });
    }
    if (!targetValue || targetValue <= 0) {
      return res.status(400).json({ message: 'Meta quantitativa precisa de um valor alvo maior que zero' });
    }
  }

  const resolvedFrequency = {
    kind: FREQUENCY_KINDS.includes(frequency?.kind) ? frequency.kind : 'diario',
    daysOfWeek: [],
    timesPerWeek: null,
  };
  if (resolvedFrequency.kind === 'dias_semana') {
    if (!Array.isArray(frequency?.daysOfWeek) || frequency.daysOfWeek.length === 0) {
      return res.status(400).json({ message: 'Selecione ao menos um dia da semana' });
    }
    resolvedFrequency.daysOfWeek = frequency.daysOfWeek;
  }
  if (resolvedFrequency.kind === 'vezes_por_semana') {
    if (!frequency?.timesPerWeek || frequency.timesPerWeek < 1 || frequency.timesPerWeek > 7) {
      return res.status(400).json({ message: 'Informe quantas vezes por semana (1 a 7)' });
    }
    resolvedFrequency.timesPerWeek = frequency.timesPerWeek;
  }

  const resolvedDurationType = durationType === 'desafio' ? 'desafio' : 'para_sempre';
  if (resolvedDurationType === 'desafio' && (!challengeDays || challengeDays < 1)) {
    return res.status(400).json({ message: 'Informe a duração do desafio em dias' });
  }

  const habit = await Habit.create({
    name,
    type,
    owner: type === 'individual' ? owner : null,
    currentTurnUserId: type === 'alternado' ? startingUserId || req.userId : null,
    subtasks: type === 'colaborativo' ? validSubtasks.map((s, index) => ({ label: s.label.trim(), order: index })) : [],
    emoji: emoji || undefined,
    color: color || undefined,
    reminderTime: reminderTime || null,
    category: category || undefined,
    difficulty: difficulty || undefined,
    frequency: resolvedFrequency,
    durationType: resolvedDurationType,
    challengeDays: resolvedDurationType === 'desafio' ? challengeDays : null,
    challengeStartDay: resolvedDurationType === 'desafio' ? todayKeyInTimezone() : null,
    goalType: resolvedGoalType,
    targetValue: resolvedGoalType === 'quantitativo' ? targetValue : null,
    unit: resolvedGoalType === 'quantitativo' ? unit || '' : '',
    maxMissesPerWeek: maxMissesPerWeek ?? undefined,
    freezesPerMonth: freezesPerMonth ?? undefined,
    createdBy: req.userId,
  });
  const populated = await habit.populate(POPULATE);
  res.status(201).json(populated);

  notifyPartner({
    actorId: req.userId,
    title: 'Novo hábito',
    body: `🎯 Novo hábito criado: "${habit.name}".`,
    link: '/app/habitos',
    category: 'habit',
  }).catch((err) => console.error('Falha ao notificar novo hábito:', err.message));
}

async function update(req, res) {
  const habit = await Habit.findById(req.params.id);
  if (!habit) return res.status(404).json({ message: 'Hábito não encontrado' });
  if (String(habit.createdBy) !== req.userId) {
    const err = new Error('Você só pode editar hábitos que você criou');
    err.status = 403;
    throw err;
  }

  const { name, emoji, color, reminderTime, active, category, difficulty, maxMissesPerWeek, freezesPerMonth, subtasks } =
    req.body;
  const patch = {};
  if (name !== undefined) patch.name = name;
  if (emoji !== undefined) patch.emoji = emoji;
  if (color !== undefined) patch.color = color;
  if (reminderTime !== undefined) patch.reminderTime = reminderTime;
  if (active !== undefined) patch.active = active;
  if (category !== undefined) patch.category = category;
  if (difficulty !== undefined) patch.difficulty = difficulty;
  if (maxMissesPerWeek !== undefined) patch.maxMissesPerWeek = maxMissesPerWeek;
  if (freezesPerMonth !== undefined) patch.freezesPerMonth = freezesPerMonth;

  // Subtasks (só colaborativo): só permite ADICIONAR itens novos ou ARQUIVAR
  // existentes (active:false) — nunca editar o label de uma subtask que já
  // tem check-ins históricos associados.
  if (subtasks !== undefined && habit.type === 'colaborativo') {
    const existingById = new Map(habit.subtasks.map((s) => [String(s._id), s]));
    const nextSubtasks = [];

    for (const incoming of subtasks) {
      if (incoming._id && existingById.has(String(incoming._id))) {
        const current = existingById.get(String(incoming._id));
        nextSubtasks.push({
          _id: current._id,
          label: current.label,
          order: current.order,
          active: incoming.active !== undefined ? incoming.active : current.active,
        });
        existingById.delete(String(incoming._id));
      } else if (!incoming._id && incoming.label && incoming.label.trim()) {
        nextSubtasks.push({ label: incoming.label.trim(), order: habit.subtasks.length + nextSubtasks.length, active: true });
      }
    }
    // Subtasks existentes que não vieram no payload são preservadas (não removidas por omissão).
    existingById.forEach((s) => nextSubtasks.push(s));
    patch.subtasks = nextSubtasks;
  }

  const updated = await Habit.findByIdAndUpdate(req.params.id, patch, {
    new: true,
    runValidators: true,
  }).populate(POPULATE);

  res.json(updated);

  notifyPartner({
    actorId: req.userId,
    title: 'Hábito atualizado',
    body: `🎯 O hábito "${updated.name}" foi atualizado.`,
    link: '/app/habitos',
    category: 'habit',
  }).catch((err) => console.error('Falha ao notificar atualização de hábito:', err.message));
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

  notifyPartner({
    actorId: req.userId,
    title: 'Hábito arquivado',
    body: `🎯 O hábito "${habit.name}" foi arquivado.`,
    link: '/app/habitos',
    category: 'habit',
  }).catch((err) => console.error('Falha ao notificar arquivamento de hábito:', err.message));
}

async function freeze(req, res) {
  const habit = await Habit.findById(req.params.id);
  if (!habit || !habit.active) return res.status(404).json({ message: 'Hábito não encontrado' });
  if (habit.type === 'individual' && String(habit.owner) !== req.userId) {
    const err = new Error('Este hábito individual não é seu');
    err.status = 403;
    throw err;
  }

  const todayKey = todayKeyInTimezone();
  const day = req.body.day || todayKey;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return res.status(400).json({ message: 'Dia inválido' });
  }
  if (day < todayKey) {
    return res.status(400).json({ message: 'Só é possível congelar hoje ou datas futuras' });
  }
  if (habit.freezeDays.some((f) => f.day === day)) {
    return res.status(409).json({ message: 'Esse dia já está congelado' });
  }

  const usedThisMonth = habit.freezeDays.filter((f) => f.day.slice(0, 7) === day.slice(0, 7)).length;
  if (usedThisMonth >= habit.freezesPerMonth) {
    const err = new Error('Sem congeladores disponíveis este mês');
    err.status = 403;
    throw err;
  }

  habit.freezeDays.push({ day });
  await habit.save();
  await habit.populate(POPULATE);
  res.status(201).json(habit);

  notifyPartner({
    actorId: req.userId,
    title: 'Congelador usado',
    body: `🧊 Um congelador foi usado no hábito "${habit.name}" (${day}).`,
    link: '/app/habitos',
    category: 'habit',
  }).catch((err) => console.error('Falha ao notificar congelador de hábito:', err.message));
}

module.exports = { list, create, update, archive, freeze };
