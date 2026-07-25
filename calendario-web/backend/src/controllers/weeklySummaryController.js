const Habit = require('../models/Habit');
const HabitCheckin = require('../models/HabitCheckin');
const User = require('../models/User');
const EmotionEntry = require('../models/EmotionEntry');
const TaskItem = require('../models/TaskItem');
const { todayKeyInTimezone, addDaysToKey, weekStartKey } = require('../utils/dayKey');
const { isPeriodComplete } = require('../services/habitStreakService');
const { ensureCurrentMonth } = require('./financeMonthController');
const { computeMonthTotals } = require('./financeEntryController');
const { computeRanking } = require('./candyEntryController');

async function summarizeHabits(team, weekStart, weekEnd) {
  const [habits, users] = await Promise.all([
    Habit.find({ team, active: true }),
    User.find({ team, includeInHabits: true }),
  ]);

  if (habits.length === 0) return { items: [], totalActive: 0 };

  const checkins = await HabitCheckin.find({
    habit: { $in: habits.map((h) => h._id) },
    day: { $gte: weekStart, $lte: weekEnd },
  });

  const checkinsByHabitDay = new Map();
  checkins.forEach((c) => {
    const key = `${c.habit}_${c.day}`;
    if (!checkinsByHabitDay.has(key)) checkinsByHabitDay.set(key, []);
    checkinsByHabitDay.get(key).push(c);
  });

  const items = habits.map((habit) => {
    let completedDaysThisWeek = 0;
    let cursor = weekStart;
    while (cursor <= weekEnd) {
      const checkinsForDay = checkinsByHabitDay.get(`${habit._id}_${cursor}`) || [];
      if (isPeriodComplete(habit, cursor, checkinsForDay, users)) completedDaysThisWeek += 1;
      cursor = addDaysToKey(cursor, 1);
    }
    return {
      _id: habit._id,
      name: habit.name,
      emoji: habit.emoji,
      currentStreak: habit.currentStreak,
      bestStreak: habit.bestStreak,
      completedDaysThisWeek,
    };
  });

  return { items, totalActive: habits.length };
}

async function summarizeFinance(team) {
  const monthRecord = await ensureCurrentMonth(team);
  const { totalReceitas, totalDespesas } = await computeMonthTotals(monthRecord.month, monthRecord.year, undefined, team);
  return {
    month: monthRecord.month,
    year: monthRecord.year,
    status: monthRecord.status,
    totalReceitas,
    totalDespesas,
    saldo: totalReceitas - totalDespesas,
  };
}

async function summarizeEmotions(team, weekStart, weekEnd) {
  const entries = await EmotionEntry.find({ team, day: { $gte: weekStart, $lte: weekEnd } }).select('intensity');
  if (entries.length === 0) return { averageIntensity: null, count: 0 };

  const sum = entries.reduce((acc, e) => acc + e.intensity, 0);
  return { averageIntensity: Math.round((sum / entries.length) * 100) / 100, count: entries.length };
}

async function summarizeTasks(team, weekStart, weekEnd) {
  // team não tem fuso próprio: usa o offset fixo de São Paulo (sem DST no
  // Brasil), mesmo espírito de dayKey.js — completedAt é Date real, não dayKey.
  const rangeStart = new Date(`${weekStart}T00:00:00.000-03:00`);
  const rangeEnd = new Date(`${weekEnd}T23:59:59.999-03:00`);

  const [completedThisWeek, totalActive] = await Promise.all([
    TaskItem.countDocuments({ team, completed: true, completedAt: { $gte: rangeStart, $lte: rangeEnd } }),
    TaskItem.countDocuments({ team, completed: false }),
  ]);

  return { completedThisWeek, totalActive };
}

async function getWeeklySummary(req, res) {
  const team = req.userTeam;
  const weekStart = weekStartKey(todayKeyInTimezone());
  const weekEnd = addDaysToKey(weekStart, 6);

  const [habits, finance, emotions, tasks, candy] = await Promise.all([
    summarizeHabits(team, weekStart, weekEnd),
    summarizeFinance(team),
    summarizeEmotions(team, weekStart, weekEnd),
    summarizeTasks(team, weekStart, weekEnd),
    computeRanking(team, 'week', todayKeyInTimezone()),
  ]);

  res.json({ weekStart, weekEnd, habits, finance, emotions, tasks, candy });
}

module.exports = { getWeeklySummary };
