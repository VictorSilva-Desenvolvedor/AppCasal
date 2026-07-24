const Habit = require('../models/Habit');
const HabitReminderLog = require('../models/HabitReminderLog');
const Settings = require('../models/Settings');
const User = require('../models/User');
const { sendWhatsappMessage } = require('./whatsappService');
const { sendPushNotification } = require('./pushService');
const { todayKeyInTimezone } = require('../utils/dayKey');
const { resolveTargetUsersAndCompletion, groupUsersByTeam } = require('./habitStreakService');

const TIMEZONE = 'America/Sao_Paulo';

// node-cron's `timezone` option só controla QUANDO o callback dispara, não o
// que `new Date()` retorna dentro dele — por isso resolvemos a hora atual
// explicitamente no fuso do app, em vez de confiar no relógio local do processo.
function currentTimeInTimezone() {
  return new Date().toLocaleTimeString('pt-BR', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
}

async function checkAndSendHabitReminders() {
  const nowStr = currentTimeInTimezone();
  const todayStr = todayKeyInTimezone();
  const habits = await Habit.find({ active: true, reminderTime: nowStr });
  if (habits.length === 0) return { sent: 0, skipped: 0 };

  const usersByTeam = groupUsersByTeam(await User.find({ includeInHabits: true }));

  let sent = 0;
  let skipped = 0;

  for (const habit of habits) {
    try {
      const targets = await resolveTargetUsersAndCompletion(habit, todayStr, usersByTeam.get(habit.team) || []);

      for (const { user: targetUser, done } of targets) {
        if (done) continue; // já completou a parte dele hoje, não precisa lembrete

        const settings = await Settings.findOne({ user: targetUser._id });
        if (settings?.habitRemindersMuted) {
          skipped++;
          continue;
        }

        const filter = { habit: habit._id, user: targetUser._id, day: todayStr };
        const existingLog = await HabitReminderLog.findOneAndUpdate(
          filter,
          { $setOnInsert: filter },
          { upsert: true, new: false }
        );
        if (existingLog) {
          skipped++;
          continue;
        }

        const channel = settings?.notificationChannel || 'both';
        const text = `⏰ Hora de "${habit.name}"!`;

        let delivered = false;
        if (channel !== 'push' && targetUser.whatsappNumber) {
          delivered = await sendWhatsappMessage(targetUser.whatsappNumber, text);
        }
        if (!delivered && channel !== 'whatsapp') {
          delivered = await sendPushNotification(targetUser._id, { title: 'Lembrete de hábito', body: text });
        }

        if (delivered) {
          sent++;
        } else {
          skipped++;
          await HabitReminderLog.deleteOne(filter);
        }
      }
    } catch (err) {
      console.error(`Falha ao processar lembrete do hábito "${habit.name}" (${habit._id}):`, err.message);
    }
  }

  return { sent, skipped };
}

module.exports = { checkAndSendHabitReminders };
