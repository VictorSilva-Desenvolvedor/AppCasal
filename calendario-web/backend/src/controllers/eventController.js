const Event = require('../models/Event');
const Invitation = require('../models/Invitation');
const { logActivity, buildUpdateDetails, formatDate } = require('../services/activityLogger');
const { normalizeRule, getOccurrencesInRange, toUTCDateOnly } = require('../utils/recurrence');
const { notifyPartner } = require('../services/notificationService');

const DEFAULT_REMINDER_OFFSETS = [5, 3, 1];

async function list(req, res) {
  const events = await Event.find({ team: req.userTeam }).populate('creator', 'name').sort({ date: 1 });
  res.json(events);
}

async function upcomingReminders(req, res) {
  const todayUTC = toUTCDateOnly(new Date());
  const events = await Event.find({ team: req.userTeam });

  const maxOffset = events.reduce((max, event) => {
    const offsets = event.reminderOffsets?.length ? event.reminderOffsets : DEFAULT_REMINDER_OFFSETS;
    return Math.max(max, ...offsets);
  }, Math.max(...DEFAULT_REMINDER_OFFSETS));
  const rangeEnd = new Date(todayUTC.getTime() + maxOffset * 86400000);

  const reminders = [];
  for (const event of events) {
    const offsets = event.reminderOffsets?.length ? event.reminderOffsets : DEFAULT_REMINDER_OFFSETS;
    const rule = normalizeRule(event);

    for (const occurrence of getOccurrencesInRange(event.date, rule, todayUTC, rangeEnd)) {
      const diffDays = Math.round((occurrence.getTime() - todayUTC.getTime()) / 86400000);
      if (!offsets.includes(diffDays)) continue;

      reminders.push({
        eventId: event._id,
        title: event.title,
        category: event.category,
        occurrenceDate: occurrence,
        diffDays,
      });
    }
  }

  reminders.sort((a, b) => a.diffDays - b.diffDays);
  res.json(reminders);
}

async function create(req, res) {
  const { title, description, date, attachments, recurrenceRule, category, color, reminderOffsets, hideWhenPast } =
    req.body;

  if (!title || !date) {
    return res.status(400).json({ message: 'Título e data são obrigatórios' });
  }

  const frequency = recurrenceRule?.frequency || 'none';

  const event = await Event.create({
    title,
    description,
    date,
    attachments: Array.isArray(attachments) ? attachments : [],
    recurrenceRule,
    recurring: frequency !== 'none',
    category: category || null,
    color: color || null,
    reminderOffsets: Array.isArray(reminderOffsets) && reminderOffsets.length ? reminderOffsets : [5, 3, 1],
    hideWhenPast: Boolean(hideWhenPast),
    creator: req.userId,
    team: req.userTeam,
  });

  await logActivity({
    actor: req.userId,
    action: 'created',
    event,
    details: `Criou o evento para ${formatDate(event.date)}`,
    team: req.userTeam,
  });

  const populated = await event.populate('creator', 'name');
  res.status(201).json(populated);

  notifyPartner({
    actorId: req.userId,
    title: 'Novo evento',
    body: `📅 Novo evento criado: "${event.title}" (${formatDate(event.date)}).`,
    link: '/app/calendario',
    category: 'event',
  }).catch((err) => console.error('Falha ao notificar novo evento:', err.message));
}

async function update(req, res) {
  const { title, description, date, attachments, recurrenceRule, category, color, reminderOffsets, hideWhenPast } =
    req.body;

  const before = await Event.findById(req.params.id);
  if (!before || String(before.team) !== req.userTeam) {
    return res.status(404).json({ message: 'Evento não encontrado' });
  }

  const frequency = recurrenceRule?.frequency || 'none';

  const event = await Event.findByIdAndUpdate(
    req.params.id,
    {
      title,
      description,
      date,
      attachments,
      recurrenceRule,
      recurring: frequency !== 'none',
      category: category || null,
      color: color || null,
      reminderOffsets: Array.isArray(reminderOffsets) && reminderOffsets.length ? reminderOffsets : [5, 3, 1],
      hideWhenPast: Boolean(hideWhenPast),
    },
    { new: true, runValidators: true }
  ).populate('creator', 'name');

  await logActivity({
    actor: req.userId,
    action: 'updated',
    event,
    details: buildUpdateDetails(before, event),
    team: req.userTeam,
  });

  res.json(event);

  notifyPartner({
    actorId: req.userId,
    title: 'Evento atualizado',
    body: `📅 O evento "${event.title}" foi atualizado.`,
    link: '/app/calendario',
    category: 'event',
  }).catch((err) => console.error('Falha ao notificar atualização de evento:', err.message));
}

async function remove(req, res) {
  const event = await Event.findOneAndDelete({ _id: req.params.id, team: req.userTeam });

  if (!event) {
    return res.status(404).json({ message: 'Evento não encontrado' });
  }

  await Invitation.deleteMany({ event: event._id });

  await logActivity({
    actor: req.userId,
    action: 'deleted',
    event,
    eventTitle: event.title,
    details: `Excluiu o evento de ${formatDate(event.date)}`,
    team: req.userTeam,
  });

  res.status(204).send();

  notifyPartner({
    actorId: req.userId,
    title: 'Evento excluído',
    body: `📅 O evento "${event.title}" foi excluído.`,
    link: '/app/calendario',
    category: 'event',
  }).catch((err) => console.error('Falha ao notificar exclusão de evento:', err.message));
}

module.exports = { list, create, update, remove, upcomingReminders };
