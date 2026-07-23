const Habit = require('../models/Habit');
const HabitCheckin = require('../models/HabitCheckin');
const HabitReminderLog = require('../models/HabitReminderLog');
const Settings = require('../models/Settings');
const User = require('../models/User');
const { sendWhatsappMessage } = require('./whatsappService');
const { sendPushNotification } = require('./pushService');

const TIMEZONE = 'America/Sao_Paulo';

// node-cron's `timezone` option só controla QUANDO o callback dispara, não o
// que `new Date()` retorna dentro dele — por isso resolvemos hora/dia explicitamente
// no fuso do app, em vez de confiar no relógio local do processo.
function nowInTimezone() {
  const now = new Date();
  const nowStr = now.toLocaleTimeString('pt-BR', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  return { nowStr, todayStr };
}

async function checkAndSendHabitReminders() {
  const { nowStr, todayStr } = nowInTimezone();
  const habits = await Habit.find({ active: true, reminderTime: nowStr });
  if (habits.length === 0) return { sent: 0, skipped: 0 };

  const users = await User.find();
  const usersById = new Map(users.map((u) => [String(u._id), u]));

  let sent = 0;
  let skipped = 0;

  for (const habit of habits) {
    try {
      const targetIds = habit.type === 'casal' ? users.map((u) => String(u._id)) : [String(habit.owner)];

      for (const userId of targetIds) {
        const targetUser = usersById.get(userId);
        if (!targetUser) continue;

        const settings = await Settings.findOne({ user: userId });
        if (settings?.habitRemindersMuted) {
          skipped++;
          continue;
        }

        const already = await HabitCheckin.exists({ habit: habit._id, user: userId, day: todayStr });
        if (already) continue; // já fez o check-in hoje, não precisa lembrete

        const filter = { habit: habit._id, user: userId, day: todayStr };
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
