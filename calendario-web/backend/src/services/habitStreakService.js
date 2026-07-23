const Habit = require('../models/Habit');
const HabitCheckin = require('../models/HabitCheckin');
const User = require('../models/User');
const {
  todayKeyInTimezone,
  addDaysToKey,
  dayOfWeekFromKey,
  weekStartKey,
  daysBetweenKeys,
  dayKeyFromDate,
} = require('../utils/dayKey');

// Versão backend (persistida) da regra de completude de dia, por tipo de
// hábito. Congelamento (freeze) tem prioridade sobre qualquer outra regra.
function isPeriodComplete(habit, dayKey, checkinsForDay, users) {
  if (habit.freezeDays.some((f) => f.day === dayKey)) return true;

  if (habit.type === 'colaborativo') {
    const activeSubtaskIds = habit.subtasks.filter((s) => s.active).map((s) => String(s._id));
    if (activeSubtaskIds.length === 0) return false;
    return activeSubtaskIds.every((id) => checkinsForDay.some((c) => String(c.subtask) === id));
  }

  if (habit.type === 'alternado') {
    return checkinsForDay.length > 0;
  }

  const targetUserIds = habit.type === 'individual' ? [String(habit.owner)] : users.map((u) => String(u._id));

  return targetUserIds.every((userId) => {
    const userCheckins = checkinsForDay.filter((c) => String(c.user) === userId);
    if (habit.goalType === 'quantitativo') {
      const sum = userCheckins.reduce((acc, c) => acc + (c.value || 0), 0);
      return sum >= (habit.targetValue || 0);
    }
    return userCheckins.length > 0;
  });
}

// Agrupa usuários por equipe — hábitos "casal"/"colaborativo"/"alternado" só
// podem avaliar/lembrar usuários da mesma equipe do hábito, senão um hábito
// real passaria a exigir check-in da equipe de teste (e vice-versa).
function groupUsersByTeam(users) {
  const byTeam = new Map();
  for (const user of users) {
    const list = byTeam.get(user.team) || [];
    list.push(user);
    byTeam.set(user.team, list);
  }
  return byTeam;
}

// Resolve, para lembrete/nudge, quem são os "alvos" desse hábito num dia e se
// cada um já completou sua parte — evita duplicar a ramificação por tipo em
// habitNudgeService/habitReminderService.
async function resolveTargetUsersAndCompletion(habit, dayKey, users) {
  const checkins = await HabitCheckin.find({ habit: habit._id, day: dayKey });

  if (habit.type === 'alternado') {
    const turnUser = users.find((u) => String(u._id) === String(habit.currentTurnUserId));
    return turnUser ? [{ user: turnUser, done: checkins.length > 0 }] : [];
  }

  if (habit.type === 'colaborativo') {
    const done = isPeriodComplete(habit, dayKey, checkins, users);
    return users.map((u) => ({ user: u, done }));
  }

  if (habit.type === 'individual') {
    const owner = users.find((u) => String(u._id) === String(habit.owner));
    return owner ? [{ user: owner, done: isPeriodComplete(habit, dayKey, checkins, users) }] : [];
  }

  // casal / espelhado: status individual de cada usuário (isPeriodComplete
  // com um array de 1 usuário avalia só a parte dele).
  return users.map((u) => ({ user: u, done: isPeriodComplete(habit, dayKey, checkins, [u]) }));
}

function isDayExpected(habit, dayKey) {
  const { kind, daysOfWeek } = habit.frequency;
  if (kind === 'diario') return true;
  if (kind === 'dias_semana') return daysOfWeek.includes(dayOfWeekFromKey(dayKey));
  if (kind === 'quinzenal') {
    const anchor = habit.challengeStartDay || dayKeyFromDate(habit.createdAt);
    const diff = daysBetweenKeys(anchor, dayKey);
    return diff >= 0 && diff % 14 === 0;
  }
  return true; // 'vezes_por_semana' não passa por aqui (unidade é a semana)
}

function resetRecoveryChallenge(habit) {
  habit.recoveryChallenge = {
    active: false,
    brokenStreakLength: null,
    startDay: null,
    daysCompleted: 0,
    restoredAmount: null,
  };
}

function applyStreakSuccess(habit, dayKey) {
  if (habit.currentStreak === 0) habit.currentStreakStartDay = dayKey;
  habit.currentStreak += 1;
  habit.bestStreak = Math.max(habit.bestStreak, habit.currentStreak);

  if (habit.durationType === 'desafio' && !habit.challengeCompletedAt && habit.currentStreak >= habit.challengeDays) {
    habit.challengeCompletedAt = new Date();
  }

  if (habit.recoveryChallenge.active) {
    habit.recoveryChallenge.daysCompleted += 1;
    if (habit.recoveryChallenge.daysCompleted >= 3) {
      habit.currentStreak = habit.recoveryChallenge.restoredAmount + 3;
      habit.bestStreak = Math.max(habit.bestStreak, habit.currentStreak);
      resetRecoveryChallenge(habit);
    }
  }
}

// dayKey aqui é o dia que FALHOU (daily) ou o domingo da semana que falhou
// (weekly) — o fim da streak anterior é sempre o dia/semana imediatamente
// antes dele.
function applyStreakBreak(habit, dayKey, unit) {
  const wasInRecovery = habit.recoveryChallenge.active;
  const brokenLength = habit.currentStreak;

  if (brokenLength > 0) {
    habit.streakHistory.push({
      startDay: habit.currentStreakStartDay || dayKey,
      endDay: addDaysToKey(dayKey, -1),
      length: brokenLength,
      unit,
    });
  }

  habit.currentStreak = 0;
  habit.currentStreakStartDay = null;

  if (wasInRecovery) {
    // Falhou durante a própria tentativa de recuperação — cancela, sem
    // oferecer um novo desafio automaticamente (suposição declarada no plano).
    resetRecoveryChallenge(habit);
  } else if (brokenLength >= 3) {
    habit.recoveryChallenge = {
      active: true,
      brokenStreakLength: brokenLength,
      startDay: dayKey,
      daysCompleted: 0,
      restoredAmount: Math.floor(brokenLength / 2),
    };
  }
}

async function evaluateDayUnit(habit, yesterdayKey, users) {
  if (habit.lastEvaluatedDay === yesterdayKey) return; // idempotência (reexecução do cron)

  if (!isDayExpected(habit, yesterdayKey)) {
    habit.lastEvaluatedDay = yesterdayKey;
    await habit.save();
    return;
  }

  const checkins = await HabitCheckin.find({ habit: habit._id, day: yesterdayKey });
  const complete = isPeriodComplete(habit, yesterdayKey, checkins, users);

  if (complete) {
    applyStreakSuccess(habit, yesterdayKey);
  } else {
    const weekKey = weekStartKey(yesterdayKey);
    if (habit.missesWeekKey !== weekKey) {
      habit.missesWeekKey = weekKey;
      habit.missesThisWeek = 0;
    }
    if (habit.missesThisWeek < habit.maxMissesPerWeek) {
      habit.missesThisWeek += 1; // tolerado: não avança, não quebra
    } else {
      applyStreakBreak(habit, yesterdayKey, 'dias');
    }
  }

  habit.lastEvaluatedDay = yesterdayKey;
  await habit.save();
}

async function evaluateWeekUnit(habit, saturdayKey, users) {
  if (habit.lastEvaluatedDay === saturdayKey) return;

  const start = weekStartKey(saturdayKey); // domingo da semana
  const checkins = await HabitCheckin.find({ habit: habit._id, day: { $gte: start, $lte: saturdayKey } });
  const checkinsByDay = new Map();
  checkins.forEach((c) => {
    if (!checkinsByDay.has(c.day)) checkinsByDay.set(c.day, []);
    checkinsByDay.get(c.day).push(c);
  });

  let daysComplete = 0;
  let cursor = start;
  while (cursor <= saturdayKey) {
    if (isPeriodComplete(habit, cursor, checkinsByDay.get(cursor) || [], users)) daysComplete += 1;
    cursor = addDaysToKey(cursor, 1);
  }

  if (daysComplete >= habit.frequency.timesPerWeek) {
    applyStreakSuccess(habit, start);
  } else {
    applyStreakBreak(habit, start, 'semanas');
  }

  habit.lastEvaluatedDay = saturdayKey;
  await habit.save();
}

async function evaluateOneHabit(habit, yesterdayKey, users) {
  if (habit.frequency.kind === 'vezes_por_semana') {
    if (dayOfWeekFromKey(yesterdayKey) === 6) {
      await evaluateWeekUnit(habit, yesterdayKey, users);
    }
    return;
  }
  await evaluateDayUnit(habit, yesterdayKey, users);
}

async function evaluateHabitStreaks() {
  const todayKey = todayKeyInTimezone();
  const yesterdayKey = addDaysToKey(todayKey, -1);
  const habits = await Habit.find({ active: true });
  const usersByTeam = groupUsersByTeam(await User.find({ includeInHabits: true }));

  for (const habit of habits) {
    try {
      await evaluateOneHabit(habit, yesterdayKey, usersByTeam.get(habit.team) || []);
    } catch (err) {
      console.error(`Falha ao avaliar streak do hábito "${habit.name}" (${habit._id}):`, err.message);
    }
  }
}

module.exports = { evaluateHabitStreaks, isPeriodComplete, resolveTargetUsersAndCompletion, groupUsersByTeam };
