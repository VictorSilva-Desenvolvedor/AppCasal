const Event = require('../models/Event');

async function list(req, res) {
  const events = await Event.find().populate('creator', 'name').sort({ date: 1 });
  res.json(events);
}

async function create(req, res) {
  const { title, description, date, attachments } = req.body;

  if (!title || !date) {
    return res.status(400).json({ message: 'Título e data são obrigatórios' });
  }

  const event = await Event.create({
    title,
    description,
    date,
    attachments: Array.isArray(attachments) ? attachments : [],
    creator: req.userId,
  });

  const populated = await event.populate('creator', 'name');
  res.status(201).json(populated);
}

async function update(req, res) {
  const { title, description, date, attachments } = req.body;

  const event = await Event.findByIdAndUpdate(
    req.params.id,
    { title, description, date, attachments },
    { new: true, runValidators: true }
  ).populate('creator', 'name');

  if (!event) {
    return res.status(404).json({ message: 'Evento não encontrado' });
  }

  res.json(event);
}

async function remove(req, res) {
  const event = await Event.findByIdAndDelete(req.params.id);

  if (!event) {
    return res.status(404).json({ message: 'Evento não encontrado' });
  }

  res.status(204).send();
}

module.exports = { list, create, update, remove };
