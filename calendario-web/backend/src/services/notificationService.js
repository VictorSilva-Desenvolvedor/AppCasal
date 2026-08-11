const User = require('../models/User');
const Settings = require('../models/Settings');
const Notification = require('../models/Notification');
const { sendPushNotification } = require('./pushService');
const { sendFcmPush } = require('./fcmService');

// Avisa o parceiro de uma ação feita por alguém no app. Sempre persiste a
// notificação (histórico in-app completo); o Settings do destinatário só
// controla se o aviso também é entregue por push/FCM.
async function notifyPartner({
  actorId,
  recipientId,
  title,
  body,
  link = '',
  category = 'general',
  settingsFlag = 'notifyOnPartnerActivity',
}) {
  let recipient;
  if (recipientId) {
    recipient = await User.findById(recipientId);
  } else {
    const actor = await User.findById(actorId, 'team');
    recipient = actor && (await User.findOne({ _id: { $ne: actorId }, includeInHabits: true, team: actor.team }));
  }
  if (!recipient) return;

  await Notification.create({ recipient: recipient._id, actor: actorId, title, body, link, category });

  const settings = await Settings.findOne({ user: recipient._id });
  if (settings?.[settingsFlag] === false) return;

  await sendPushNotification(recipient._id, { title, body });
  await sendFcmPush(recipient._id, { title, body, link });
}

module.exports = { notifyPartner };
