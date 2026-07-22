const EmotionEntry = require('../models/EmotionEntry');

const ENTRY_POPULATE = { path: 'user', select: 'name' };

async function list(req, res) {
  const { user, day, period } = req.query;
  const filter = {};
  if (user) filter.user = user;
  if (day) filter.day = day;
  if (period) filter.period = period;

  const entries = await EmotionEntry.find(filter).populate(ENTRY_POPULATE).sort({ createdAt: 1 });
  res.json(entries);
}

async function create(req, res) {
  const { day, period, emotion, intensity, note } = req.body;

  if (!day || !period || !emotion || !intensity) {
    return res.status(400).json({ message: 'Dia, período, emoção e intensidade são obrigatórios' });
  }

  const entry = await EmotionEntry.create({ day, period, emotion, intensity, note: note || '', user: req.userId });
  const populated = await entry.populate(ENTRY_POPULATE);
  res.status(201).json(populated);
}

async function update(req, res) {
  const { emotion, intensity, note } = req.body;

  const entry = await EmotionEntry.findById(req.params.id);
  if (!entry) return res.status(404).json({ message: 'Registro não encontrado' });
  if (String(entry.user) !== req.userId) {
    const err = new Error('Você só pode editar seus próprios registros de emoção');
    err.status = 403;
    throw err;
  }

  const updated = await EmotionEntry.findByIdAndUpdate(
    req.params.id,
    { emotion, intensity, note },
    { new: true, runValidators: true }
  ).populate(ENTRY_POPULATE);

  res.json(updated);
}

async function remove(req, res) {
  const entry = await EmotionEntry.findById(req.params.id);
  if (!entry) return res.status(404).json({ message: 'Registro não encontrado' });
  if (String(entry.user) !== req.userId) {
    const err = new Error('Você só pode excluir seus próprios registros de emoção');
    err.status = 403;
    throw err;
  }

  await EmotionEntry.findByIdAndDelete(entry._id);
  res.status(204).send();
}

module.exports = { list, create, update, remove };
