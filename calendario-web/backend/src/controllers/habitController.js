const Habit = require('../models/Habit');
const HabitCheckin = require('../models/HabitCheckin');
const HabitReminderLog = require('../models/HabitReminderLog');
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

// Compartilhado entre create e update: type é sempre imutável no update (não
// dá pra reinterpretar o histórico de check-ins com uma estrutura diferente),
// mas meta/frequência/duração podem mudar a qualquer momento — o cron de
// streak (habitStreakService.js) lê esses campos ao vivo a cada avaliação.
function resolveHabitConfig(type, { goalType, targetValue, unit, frequency, durationType, challengeDays }) {
  const resolvedGoalType = goalType === 'quantitativo' ? 'quantitativo' : 'binario';
  if (resolvedGoalType === 'quantitativo') {
    if (!QUANTITATIVE_ALLOWED_TYPES.includes(type)) {
      const err = new Error('Meta quantitativa não é válida para esse tipo de hábito');
      err.status = 400;
      throw err;
    }
    if (!targetValue || targetValue <= 0) {
      const err = new Error('Meta quantitativa precisa de um valor alvo maior que zero');
      err.status = 400;
      throw err;
    }
  }

  const resolvedFrequency = {
    kind: FREQUENCY_KINDS.includes(frequency?.kind) ? frequency.kind : 'diario',
    daysOfWeek: [],
    timesPerWeek: null,
  };
  if (resolvedFrequency.kind === 'dias_semana') {
    if (!Array.isArray(frequency?.daysOfWeek) || frequency.daysOfWeek.length === 0) {
      const err = new Error('Selecione ao menos um dia da semana');
      err.status = 400;
      throw err;
    }
    resolvedFrequency.daysOfWeek = frequency.daysOfWeek;
  }
  if (resolvedFrequency.kind === 'vezes_por_semana') {
    if (!frequency?.timesPerWeek || frequency.timesPerWeek < 1 || frequency.timesPerWeek > 7) {
      const err = new Error('Informe quantas vezes por semana (1 a 7)');
      err.status = 400;
      throw err;
    }
    resolvedFrequency.timesPerWeek = frequency.timesPerWeek;
  }

  const resolvedDurationType = durationType === 'desafio' ? 'desafio' : 'para_sempre';
  if (resolvedDurationType === 'desafio' && (!challengeDays || challengeDays < 1)) {
    const err = new Error('Informe a duração do desafio em dias');
    err.status = 400;
    throw err;
  }

  return {
    goalType: resolvedGoalType,
    targetValue: resolvedGoalType === 'quantitativo' ? targetValue : null,
    unit: resolvedGoalType === 'quantitativo' ? unit || '' : '',
    frequency: resolvedFrequency,
    durationType: resolvedDurationType,
    challengeDays: resolvedDurationType === 'desafio' ? challengeDays : null,
  };
}

async function list(req, res) {
  const { type, active } = req.query;
  const filter = { team: req.userTeam };
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

  const resolved = resolveHabitConfig(type, { goalType, targetValue, unit, frequency, durationType, challengeDays });

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
    frequency: resolved.frequency,
    durationType: resolved.durationType,
    challengeDays: resolved.challengeDays,
    challengeStartDay: resolved.durationType === 'desafio' ? todayKeyInTimezone() : null,
    goalType: resolved.goalType,
    targetValue: resolved.targetValue,
    unit: resolved.unit,
    maxMissesPerWeek: maxMissesPerWeek ?? undefined,
    freezesPerMonth: freezesPerMonth ?? undefined,
    createdBy: req.userId,
    team: req.userTeam,
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
  if (!habit || String(habit.team) !== req.userTeam) return res.status(404).json({ message: 'Hábito não encontrado' });
  if (String(habit.createdBy) !== req.userId) {
    const err = new Error('Você só pode editar hábitos que você criou');
    err.status = 403;
    throw err;
  }

  const {
    name,
    emoji,
    color,
    reminderTime,
    active,
    category,
    difficulty,
    maxMissesPerWeek,
    freezesPerMonth,
    subtasks,
    owner,
    startingUserId,
    goalType,
    targetValue,
    unit,
    frequency,
    durationType,
    challengeDays,
  } = req.body;
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

  // type é imutável (ver resolveHabitConfig), mas os campos abaixo são lidos
  // ao vivo pelo cron de streak (habitStreakService.js) e podem ser editados
  // a qualquer momento, mesmo com check-ins já registrados.
  if (owner !== undefined && habit.type === 'individual') {
    if (!owner) {
      const err = new Error('Hábitos individuais precisam de um dono');
      err.status = 400;
      throw err;
    }
    patch.owner = owner;
  }
  if (startingUserId !== undefined && habit.type === 'alternado') {
    patch.currentTurnUserId = startingUserId;
  }
  if (goalType !== undefined || frequency !== undefined || durationType !== undefined) {
    const resolved = resolveHabitConfig(habit.type, { goalType, targetValue, unit, frequency, durationType, challengeDays });
    patch.goalType = resolved.goalType;
    patch.targetValue = resolved.targetValue;
    patch.unit = resolved.unit;
    patch.frequency = resolved.frequency;
    patch.durationType = resolved.durationType;
    patch.challengeDays = resolved.challengeDays;

    if (resolved.durationType === 'desafio' && !habit.challengeStartDay) {
      patch.challengeStartDay = todayKeyInTimezone();
    } else if (resolved.durationType === 'para_sempre') {
      patch.challengeStartDay = null;
      patch.challengeCompletedAt = null;
    }
  }

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

  // .save() (em vez de findByIdAndUpdate) garante que os validators do schema
  // (ex.: owner exigido só para type === 'individual') enxerguem o documento
  // completo, já que agora o patch pode incluir owner/currentTurnUserId.
  Object.assign(habit, patch);
  await habit.save();
  await habit.populate(POPULATE);

  res.json(habit);

  notifyPartner({
    actorId: req.userId,
    title: 'Hábito atualizado',
    body: `🎯 O hábito "${habit.name}" foi atualizado.`,
    link: '/app/habitos',
    category: 'habit',
  }).catch((err) => console.error('Falha ao notificar atualização de hábito:', err.message));
}

async function archive(req, res) {
  const habit = await Habit.findById(req.params.id);
  if (!habit || String(habit.team) !== req.userTeam) return res.status(404).json({ message: 'Hábito não encontrado' });
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

async function remove(req, res) {
  const habit = await Habit.findById(req.params.id);
  if (!habit || String(habit.team) !== req.userTeam) return res.status(404).json({ message: 'Hábito não encontrado' });
  if (String(habit.createdBy) !== req.userId) {
    const err = new Error('Você só pode excluir hábitos que você criou');
    err.status = 403;
    throw err;
  }
  if (habit.active) {
    return res.status(400).json({ message: 'Arquive o hábito antes de excluí-lo permanentemente' });
  }

  await Habit.findByIdAndDelete(habit._id);
  await HabitCheckin.deleteMany({ habit: habit._id });
  await HabitReminderLog.deleteMany({ habit: habit._id });

  res.status(204).send();

  notifyPartner({
    actorId: req.userId,
    title: 'Hábito excluído',
    body: `🗑️ O hábito "${habit.name}" foi excluído permanentemente.`,
    link: '/app/habitos',
    category: 'habit',
  }).catch((err) => console.error('Falha ao notificar exclusão de hábito:', err.message));
}

async function freeze(req, res) {
  const habit = await Habit.findById(req.params.id);
  if (!habit || !habit.active || String(habit.team) !== req.userTeam) {
    return res.status(404).json({ message: 'Hábito não encontrado' });
  }
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

module.exports = { list, create, update, archive, remove, freeze };
