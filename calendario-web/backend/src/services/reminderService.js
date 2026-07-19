const Event = require('../models/Event');
const Invitation = require('../models/Invitation');
const ReminderLog = require('../models/ReminderLog');
const { sendWhatsappMessage } = require('./whatsappService');
const { normalizeRule, getOccurrencesInRange, toUTCDateOnly } = require('../utils/recurrence');

const OFFSETS = [5, 3, 1];
const MAX_OFFSET = Math.max(...OFFSETS);

function diffInDays(a, b) {
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

function formatBR(date) {
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

async function resolveRecipients(event) {
  const recipients = new Map();

  if (event.creator) {
    if (event.creator.whatsappNumber) {
      recipients.set(String(event.creator._id), event.creator);
    } else {
      console.error(`Criador ${event.creator.name} sem WhatsApp cadastrado; ignorando para o evento "${event.title}".`);
    }
  }

  const invitations = await Invitation.find({ event: event._id, status: 'accepted' }).populate(
    'invitee',
    'name whatsappNumber'
  );

  for (const inv of invitations) {
    const user = inv.invitee;
    if (!user) continue;
    if (!user.whatsappNumber) {
      console.error(`Convidado ${user.name} sem WhatsApp cadastrado; ignorando para o evento "${event.title}".`);
      continue;
    }
    recipients.set(String(user._id), user);
  }

  return Array.from(recipients.values());
}

async function checkAndSendReminders() {
  const todayUTC = toUTCDateOnly(new Date());
  const events = await Event.find().populate('creator', 'name whatsappNumber');

  let sent = 0;
  let skipped = 0;

  const rangeEnd = new Date(todayUTC.getTime() + MAX_OFFSET * 86400000);

  for (const event of events) {
    try {
      const rule = normalizeRule(event);
      const qualifying = getOccurrencesInRange(event.date, rule, todayUTC, rangeEnd)
        .map((occurrence) => ({ occurrence, diff: diffInDays(occurrence, todayUTC) }))
        .filter(({ diff }) => OFFSETS.includes(diff));

      if (qualifying.length === 0) continue;

      const recipients = await resolveRecipients(event);
      if (recipients.length === 0) continue;

      for (const { occurrence, diff } of qualifying) {
        const text = `🔔 Lembrete: "${event.title}" é em ${diff} dia${diff > 1 ? 's' : ''} (${formatBR(occurrence)}).`;

        for (const recipient of recipients) {
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

          const ok = await sendWhatsappMessage(recipient.whatsappNumber, text);
          if (ok) {
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
