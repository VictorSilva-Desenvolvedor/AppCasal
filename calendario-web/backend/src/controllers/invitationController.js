const Invitation = require('../models/Invitation');
const Event = require('../models/Event');
const User = require('../models/User');
const Settings = require('../models/Settings');
const { sendWhatsappMessage } = require('../services/whatsappService');
const { sendPushNotification } = require('../services/pushService');

const POPULATE = [
  { path: 'event', select: 'title date' },
  { path: 'inviter', select: 'name' },
  { path: 'invitee', select: 'name' },
];

async function notifyInvitee(invitation) {
  const [invitee, settings] = await Promise.all([
    User.findById(invitation.invitee._id, 'name whatsappNumber'),
    Settings.findOne({ user: invitation.invitee._id }),
  ]);
  if (!invitee || settings?.notifyOnInvite === false) return;

  const text = `📅 ${invitation.inviter.name} te convidou para o evento "${invitation.event.title}".`;
  const channel = settings?.notificationChannel || 'both';

  let delivered = false;
  if (channel !== 'push' && invitee.whatsappNumber) {
    delivered = await sendWhatsappMessage(invitee.whatsappNumber, text);
  }
  if (!delivered && channel !== 'whatsapp') {
    await sendPushNotification(invitee._id, { title: 'Novo convite', body: text });
  }
}

async function list(req, res) {
  const invitations = await Invitation.find({
    $or: [{ inviter: req.userId }, { invitee: req.userId }],
  })
    .populate(POPULATE)
    .sort({ createdAt: -1 });
  res.json(invitations);
}

async function create(req, res) {
  const { eventId, inviteeId } = req.body;

  if (!eventId || !inviteeId) {
    return res.status(400).json({ message: 'Evento e convidado são obrigatórios' });
  }
  if (inviteeId === req.userId) {
    return res.status(400).json({ message: 'Você não pode convidar a si mesmo' });
  }

  const event = await Event.findById(eventId);
  if (!event) {
    return res.status(404).json({ message: 'Evento não encontrado' });
  }
  if (event.creator.toString() !== req.userId) {
    return res.status(403).json({ message: 'Só quem criou o evento pode convidar' });
  }

  const existing = await Invitation.findOne({
    event: eventId,
    invitee: inviteeId,
    status: { $in: ['pending', 'accepted'] },
  });
  if (existing) {
    return res.status(409).json({ message: 'Este usuário já foi convidado para este evento' });
  }

  const invitation = await Invitation.create({ event: eventId, inviter: req.userId, invitee: inviteeId });
  await invitation.populate(POPULATE);
  res.status(201).json(invitation);

  notifyInvitee(invitation).catch((err) => console.error('Falha ao notificar convite:', err.message));
}

async function respond(req, res) {
  const { status } = req.body;
  if (!['accepted', 'declined'].includes(status)) {
    return res.status(400).json({ message: 'Status inválido' });
  }

  const invitation = await Invitation.findById(req.params.id);
  if (!invitation) {
    return res.status(404).json({ message: 'Convite não encontrado' });
  }
  if (invitation.invitee.toString() !== req.userId) {
    return res.status(403).json({ message: 'Este convite não é seu' });
  }
  if (invitation.status !== 'pending') {
    return res.status(400).json({ message: 'Este convite já foi respondido' });
  }

  invitation.status = status;
  await invitation.save();
  await invitation.populate(POPULATE);
  res.json(invitation);
}

async function remove(req, res) {
  const invitation = await Invitation.findById(req.params.id);
  if (!invitation) {
    return res.status(404).json({ message: 'Convite não encontrado' });
  }
  if (invitation.inviter.toString() !== req.userId) {
    return res.status(403).json({ message: 'Você não pode cancelar este convite' });
  }
  if (invitation.status !== 'pending') {
    return res.status(400).json({ message: 'Só é possível cancelar convites pendentes' });
  }

  await invitation.deleteOne();
  res.status(204).send();
}

module.exports = { list, create, respond, remove };
