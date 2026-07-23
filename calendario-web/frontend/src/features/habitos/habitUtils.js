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

function groupCheckinsByDay(checkins) {
  const map = new Map();
  checkins.forEach((checkin) => {
    if (!map.has(checkin.day)) map.set(checkin.day, []);
    map.get(checkin.day).push(checkin);
  });
  return map;
}

// Individual: só o dono precisa de check-in. Casal: TODOS os usuários do app
// precisam ter check-in nesse dia — é essa regra que faz a streak de casal só
// avançar quando os dois completam.
export function isDayComplete(habit, dayKey, checkinsByDay, users) {
  const dayCheckins = checkinsByDay.get(dayKey) || [];
  if (habit.type === 'individual') {
    const ownerId = habit.owner?._id ?? habit.owner;
    return dayCheckins.some((c) => checkinUserId(c) === ownerId);
  }
  return users.every((u) => dayCheckins.some((c) => checkinUserId(c) === u._id));
}

// Caminha de ontem pra trás contando dias completos consecutivos. Hoje só
// entra na contagem se JÁ tiver sido completado — enquanto o dia não termina,
// não fazer check-in ainda não quebra a streak.
export function computeCurrentStreak(habit, habitCheckins, users, today = new Date()) {
  const checkinsByDay = groupCheckinsByDay(habitCheckins);
  const todayKey = toDayKey(today);
  const createdKey = toDayKey(new Date(habit.createdAt));

  let streak = isDayComplete(habit, todayKey, checkinsByDay, users) ? 1 : 0;

  let cursor = addDays(todayKey, -1);
  while (cursor >= createdKey) {
    if (!isDayComplete(habit, cursor, checkinsByDay, users)) break;
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

// 'complete' | 'partial' (só casal, um fez e o outro não) | 'missed' | 'none'
// (antes da criação do hábito, ou dia futuro / hoje ainda sem nenhum check-in)
export function computeDayStatus(habit, dayKey, habitCheckins, users, today = new Date()) {
  const checkinsByDay = groupCheckinsByDay(habitCheckins);
  const todayKey = toDayKey(today);
  const createdKey = toDayKey(new Date(habit.createdAt));

  if (dayKey < createdKey || dayKey > todayKey) return 'none';
  if (isDayComplete(habit, dayKey, checkinsByDay, users)) return 'complete';

  const dayCheckins = checkinsByDay.get(dayKey) || [];
  const hasPartial = habit.type === 'casal' && dayCheckins.length > 0;

  if (dayKey === todayKey) return hasPartial ? 'partial' : 'none';
  return hasPartial ? 'partial' : 'missed';
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
