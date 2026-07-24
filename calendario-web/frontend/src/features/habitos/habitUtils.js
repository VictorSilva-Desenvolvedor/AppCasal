export const HABIT_TYPE_LABELS = {
  casal: 'Sincronizado',
  individual: 'Individual',
  espelhado: 'Espelhado',
  alternado: 'Alternado',
  colaborativo: 'Colaborativo',
};

export const HABIT_TYPE_DESCRIPTIONS = {
  casal: 'Cada um faz o hábito no seu próprio ritmo, todo dia — os dois são acompanhados lado a lado.',
  individual: 'Só uma pessoa faz esse hábito; o check-in é sempre dela.',
  espelhado: 'Como o Sincronizado: cada um faz e marca o próprio check-in todo dia.',
  alternado: 'Só uma pessoa por vez faz o hábito, revezando entre os dois a cada check-in.',
  colaborativo: 'Uma lista de subtarefas que vocês dividem e completam juntos.',
};

export function toDayKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(dayKey, delta) {
  const [y, m, d] = dayKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + delta);
  return toDayKey(date);
}

function checkinUserId(checkin) {
  return checkin.user?._id ?? checkin.user;
}

export function groupCheckinsByHabit(checkins) {
  const map = new Map();
  checkins.forEach((checkin) => {
    const habitId = checkin.habit?._id ?? checkin.habit;
    if (!map.has(habitId)) map.set(habitId, []);
    map.get(habitId).push(checkin);
  });
  return map;
}

export function groupCheckinsByDay(checkins) {
  const map = new Map();
  checkins.forEach((checkin) => {
    if (!map.has(checkin.day)) map.set(checkin.day, []);
    map.get(checkin.day).push(checkin);
  });
  return map;
}

// Espelho, no cliente, da regra de completude de dia do backend
// (habitStreakService.isPeriodComplete) — usada só pra UI otimista ("hoje já
// está completo até agora"), nunca pra persistir/calcular a streak em si
// (isso é responsabilidade do backend, ver displayStreak).
export function isDayComplete(habit, dayKey, checkinsByDay, users) {
  if (habit.freezeDays?.some((f) => f.day === dayKey)) return true;

  const dayCheckins = checkinsByDay.get(dayKey) || [];

  if (habit.type === 'colaborativo') {
    const activeSubtaskIds = (habit.subtasks || []).filter((s) => s.active).map((s) => String(s._id));
    if (activeSubtaskIds.length === 0) return false;
    return activeSubtaskIds.every((id) => dayCheckins.some((c) => String(c.subtask?._id ?? c.subtask) === id));
  }

  if (habit.type === 'alternado') {
    return dayCheckins.length > 0;
  }

  const ownerId = habit.owner?._id ?? habit.owner;
  const targetUserIds = habit.type === 'individual' ? [ownerId] : users.map((u) => u._id);

  return targetUserIds.every((userId) => {
    const userCheckins = dayCheckins.filter((c) => checkinUserId(c) === userId);
    if (habit.goalType === 'quantitativo') {
      const sum = userCheckins.reduce((acc, c) => acc + (c.value || 0), 0);
      return sum >= (habit.targetValue || 0);
    }
    return userCheckins.length > 0;
  });
}

// 'complete' | 'partial' (alguém fez, mas não todos) | 'frozen' | 'missed' |
// 'none' (antes da criação do hábito, ou dia futuro/hoje-sem-checkin-ainda)
export function computeDayStatus(habit, dayKey, habitCheckins, users, today = new Date()) {
  const checkinsByDay = groupCheckinsByDay(habitCheckins);
  const todayKey = toDayKey(today);
  const createdKey = toDayKey(new Date(habit.createdAt));

  if (dayKey < createdKey || dayKey > todayKey) return 'none';
  if (habit.freezeDays?.some((f) => f.day === dayKey)) return 'frozen';
  if (isDayComplete(habit, dayKey, checkinsByDay, users)) return 'complete';

  const dayCheckins = checkinsByDay.get(dayKey) || [];
  const hasPartial = ['casal', 'espelhado', 'colaborativo'].includes(habit.type) && dayCheckins.length > 0;

  if (dayKey === todayKey) return hasPartial ? 'partial' : 'none';
  return hasPartial ? 'partial' : 'missed';
}

// A streak em si é calculada e persistida pelo backend (habitStreakService,
// via cron noturno) — currentStreak/bestStreak vêm prontos da API. Isso só
// soma +1 de forma otimista quando hoje já está completo, mas só depois que o
// cron já processou "ontem" (evita contar hoje duas vezes antes do rollover).
export function displayStreak(habit, checkins, users, today = new Date()) {
  const todayKey = toDayKey(today);
  const yesterdayKey = addDays(todayKey, -1);
  const checkinsByDay = groupCheckinsByDay(checkins);

  const todayCounted = habit.lastEvaluatedDay === yesterdayKey && isDayComplete(habit, todayKey, checkinsByDay, users);
  return (habit.currentStreak || 0) + (todayCounted ? 1 : 0);
}

// Progresso da semana corrente para hábitos de frequência 'vezes_por_semana'
// (ex: "2/3 esta semana"). Retorna null pros demais tipos de frequência.
export function computeWeekProgress(habit, checkins, users, today = new Date()) {
  if (habit.frequency?.kind !== 'vezes_por_semana') return null;

  const todayKey = toDayKey(today);
  const weekStart = addDays(todayKey, -today.getDay()); // domingo local
  const checkinsByDay = groupCheckinsByDay(checkins);

  let done = 0;
  let cursor = weekStart;
  while (cursor <= todayKey) {
    if (isDayComplete(habit, cursor, checkinsByDay, users)) done += 1;
    cursor = addDays(cursor, 1);
  }

  return { done, target: habit.frequency.timesPerWeek };
}

// Associa cada parceiro a uma cor da identidade visual (coral/roxo) de forma
// determinística pela ordem em que os usuários vêm da API — o app já assume
// só 2 contas fixas, então não precisa de um campo de preferência dedicado.
export function getPartnerColor(userId, users) {
  const index = users.findIndex((u) => u._id === userId);
  return index === 0 ? 'var(--habit-coral)' : 'var(--habit-purple)';
}

export function buildHistoryDays(count = 35, today = new Date()) {
  const todayKey = toDayKey(today);
  const days = [];
  for (let i = count - 1; i >= 0; i--) {
    days.push(addDays(todayKey, -i));
  }
  return days;
}
