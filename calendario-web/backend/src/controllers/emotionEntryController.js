const EmotionEntry = require('../models/EmotionEntry');
const { notifyPartner } = require('../services/notificationService');

const ENTRY_POPULATE = { path: 'user', select: 'name' };

async function list(req, res) {
  const { user, day, period } = req.query;
  const filter = { team: req.userTeam };
  if (user) filter.user = user;
  if (day) filter.day = day;
  if (period) filter.period = period;

  const entries = await EmotionEntry.find(filter).populate(ENTRY_POPULATE).sort({ createdAt: 1 });
  res.json(entries);
}

async function create(req, res) {
  const { day, period, emotion, intensity, note, reasons, reasonOther } = req.body;

  if (!day || !period || !emotion || !intensity) {
    return res.status(400).json({ message: 'Dia, período, emoção e intensidade são obrigatórios' });
  }

  const entry = await EmotionEntry.create({
    day,
    period,
    emotion,
    intensity,
    note: note || '',
    reasons: reasons || [],
    reasonOther: reasonOther || '',
    user: req.userId,
    team: req.userTeam,
  });
  const populated = await entry.populate(ENTRY_POPULATE);
  res.status(201).json(populated);

  notifyPartner({
    actorId: req.userId,
    title: 'Nova emoção registrada',
    body: `💗 Seu parceiro registrou como está se sentindo hoje.`,
    link: '/app/emocoes',
    category: 'emotion',
  }).catch((err) => console.error('Falha ao notificar emoção:', err.message));
}

async function update(req, res) {
  const entry = await EmotionEntry.findById(req.params.id);
  if (!entry || String(entry.team) !== req.userTeam) return res.status(404).json({ message: 'Registro não encontrado' });

  const isOwner = String(entry.user) === req.userId;
  const patch = {};

  if (isOwner) {
    const { emotion, intensity, note, reasons, reasonOther } = req.body;
    if (emotion !== undefined) patch.emotion = emotion;
    if (intensity !== undefined) patch.intensity = intensity;
    if (note !== undefined) patch.note = note;
    if (reasons !== undefined) patch.reasons = reasons;
    if (reasonOther !== undefined) patch.reasonOther = reasonOther;
  }

  // "O que pode ajudar" pode ser escrito por qualquer um dos 2 usuários do
  // app (o dono do registro respondendo a si mesmo depois, ou o parceiro
  // sugerindo algo) — por isso não entra no bloco isOwner acima.
  if (req.body.helpText !== undefined) {
    patch.helpText = req.body.helpText;
    patch.helpTextBy = req.userId;
    patch.helpTextAt = new Date();
  }

  if (!Object.keys(patch).length) {
    const err = new Error('Você só pode editar seus próprios registros de emoção');
    err.status = 403;
    throw err;
  }

  const updated = await EmotionEntry.findByIdAndUpdate(req.params.id, patch, {
    new: true,
    runValidators: true,
  }).populate(ENTRY_POPULATE);

  res.json(updated);

  const isHelpTextOnly = req.body.helpText !== undefined && !isOwner;
  notifyPartner({
    actorId: req.userId,
    title: isHelpTextOnly ? 'Sugestão de apoio' : 'Registro de emoção atualizado',
    body: isHelpTextOnly
      ? '💗 Seu parceiro deixou uma sugestão do que pode ajudar.'
      : '💗 Um registro de emoção foi atualizado.',
    link: '/app/emocoes',
    category: 'emotion',
  }).catch((err) => console.error('Falha ao notificar atualização de emoção:', err.message));
}

async function remove(req, res) {
  const entry = await EmotionEntry.findById(req.params.id);
  if (!entry || String(entry.team) !== req.userTeam) return res.status(404).json({ message: 'Registro não encontrado' });
  if (String(entry.user) !== req.userId) {
    const err = new Error('Você só pode excluir seus próprios registros de emoção');
    err.status = 403;
    throw err;
  }

  await EmotionEntry.findByIdAndDelete(entry._id);
  res.status(204).send();

  notifyPartner({
    actorId: req.userId,
    title: 'Registro de emoção removido',
    body: '💗 Um registro de emoção foi removido.',
    link: '/app/emocoes',
    category: 'emotion',
  }).catch((err) => console.error('Falha ao notificar remoção de emoção:', err.message));
}

module.exports = { list, create, update, remove };
