const Event = require('../models/Event');
const Invitation = require('../models/Invitation');
const ReminderLog = require('../models/ReminderLog');
const Settings = require('../models/Settings');
const { sendWhatsappMessage } = require('./whatsappService');
const { sendPushNotification } = require('./pushService');
const { normalizeRule, getOccurrencesInRange, toUTCDateOnly } = require('../utils/recurrence');

const DEFAULT_OFFSETS = [5, 3, 1];

function diffInDays(a, b) {
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

function formatBR(date) {
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

async function resolveRecipients(event) {
  const candidates = new Map();

  if (event.creator) {
    candidates.set(String(event.creator._id), event.creator);
  }

  const invitations = await Invitation.find({ event: event._id, status: 'accepted' }).populate(
    'invitee',
    'name whatsappNumber'
  );

  for (const inv of invitations) {
    const user = inv.invitee;
    if (!user) continue;
    candidates.set(String(user._id), user);
  }

  const ids = Array.from(candidates.keys());
  const settingsList = await Settings.find({ user: { $in: ids } });
  const settingsByUser = new Map(settingsList.map((s) => [String(s.user), s]));

  const recipients = [];
  for (const [id, user] of candidates) {
    const settings = settingsByUser.get(id);
    if (settings?.remindersMuted) continue;

    const channel = settings?.notificationChannel || 'both';
    if (channel === 'whatsapp' && !user.whatsappNumber) {
      console.error(`${user.name} sem WhatsApp cadastrado; ignorando para o evento "${event.title}".`);
      continue;
    }

    recipients.push({ user, channel });
  }

  return recipients;
}

async function checkAndSendReminders() {
  const todayUTC = toUTCDateOnly(new Date());
  const events = await Event.find().populate('creator', 'name whatsappNumber');

  let sent = 0;
  let skipped = 0;

  const overallMaxOffset = events.reduce((max, event) => {
    const offsets = event.reminderOffsets?.length ? event.reminderOffsets : DEFAULT_OFFSETS;
    return Math.max(max, ...offsets);
  }, Math.max(...DEFAULT_OFFSETS));
  const rangeEnd = new Date(todayUTC.getTime() + overallMaxOffset * 86400000);

  for (const event of events) {
    try {
      const offsets = event.reminderOffsets?.length ? event.reminderOffsets : DEFAULT_OFFSETS;
      const rule = normalizeRule(event);
      const qualifying = getOccurrencesInRange(event.date, rule, todayUTC, rangeEnd)
        .map((occurrence) => ({ occurrence, diff: diffInDays(occurrence, todayUTC) }))
        .filter(({ diff }) => offsets.includes(diff));

      if (qualifying.length === 0) continue;

      const recipients = await resolveRecipients(event);
      if (recipients.length === 0) continue;

      for (const { occurrence, diff } of qualifying) {
        const text = `🔔 Lembrete: "${event.title}" é em ${diff} dia${diff > 1 ? 's' : ''} (${formatBR(occurrence)}).`;

        for (const { user: recipient, channel } of recipients) {
          const filter = { event: event._id, recipient: recipient._id, offsetDays: diff, occurrenceDate: occurrence };
          const already = await ReminderLog.findOneAndUpdate(
            filter,
            { $setOnInsert: filter },
            { upsert: true, new: false }
          );

          if (already) {
            skipped++;
            continue;
          }

          let delivered = false;

          if (channel !== 'push' && recipient.whatsappNumber) {
            delivered = await sendWhatsappMessage(recipient.whatsappNumber, text);
          }

          if (!delivered && channel !== 'whatsapp') {
            delivered = await sendPushNotification(recipient._id, {
              title: 'Lembrete de evento',
              body: text,
            });
          }

          if (delivered) {
            sent++;
          } else {
            skipped++;
            await ReminderLog.deleteOne(filter);
          }
        }
      }
    } catch (err) {
      console.error(`Falha ao processar lembretes do evento "${event.title}" (${event._id}):`, err.message);
    }
  }

  console.log(`Verificação de lembretes concluída: ${sent} enviado(s), ${skipped} pulado(s)/falho(s).`);
  return { sent, skipped };
}

module.exports = { checkAndSendReminders };
