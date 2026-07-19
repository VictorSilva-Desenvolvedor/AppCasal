const Event = require('../models/Event');
const Invitation = require('../models/Invitation');
const { logActivity, buildUpdateDetails, formatDate } = require('../services/activityLogger');

async function list(req, res) {
  const events = await Event.find().populate('creator', 'name').sort({ date: 1 });
  res.json(events);
}

async function create(req, res) {
  const { title, description, date, attachments, recurrenceRule, category, hideWhenPast } = req.body;

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
    hideWhenPast: Boolean(hideWhenPast),
    creator: req.userId,
  });

  await logActivity({
    actor: req.userId,
    action: 'created',
    event,
    details: `Criou o evento para ${formatDate(event.date)}`,
  });

  const populated = await event.populate('creator', 'name');
  res.status(201).json(populated);
}

async function update(req, res) {
  const { title, description, date, attachments, recurrenceRule, category, hideWhenPast } = req.body;

  const before = await Event.findById(req.params.id);
  if (!before) {
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
      hideWhenPast: Boolean(hideWhenPast),
    },
    { new: true, runValidators: true }
  ).populate('creator', 'name');

  await logActivity({
    actor: req.userId,
    action: 'updated',
    event,
    details: buildUpdateDetails(before, event),
  });

  res.json(event);
}

async function remove(req, res) {
  const event = await Event.findByIdAndDelete(req.params.id);

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
  });

  res.status(204).send();
}

module.exports = { list, create, update, remove };
