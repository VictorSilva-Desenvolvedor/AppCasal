const User = require('../models/User');
const Settings = require('../models/Settings');
const HabitCheckin = require('../models/HabitCheckin');
const { sendWhatsappMessage } = require('./whatsappService');
const { sendPushNotification } = require('./pushService');

// Avisa o parceiro quando o usuário registra check-in num hábito de casal e
// o parceiro ainda não fez o dele hoje. Só existem 2 usuários fixos no app.
async function notifyPartnerNudge(checkin, habit) {
  const partner = await User.findOne({ _id: { $ne: checkin.user } });
  if (!partner) return;

  const alreadyDone = await HabitCheckin.exists({ habit: habit._id, user: partner._id, day: checkin.day });
  if (alreadyDone) return;

  const settings = await Settings.findOne({ user: partner._id });
  if (settings?.notifyOnHabitNudge === false) return;

  const author = await User.findById(checkin.user, 'name');
  const text = `💪 ${author.name} já fez "${habit.name}" hoje. Sua vez!`;
  const channel = settings?.notificationChannel || 'both';

  let delivered = false;
  if (channel !== 'push' && partner.whatsappNumber) {
    delivered = await sendWhatsappMessage(partner.whatsappNumber, text);
  }
  if (!delivered && channel !== 'whatsapp') {
    await sendPushNotification(partner._id, { title: 'Empurrãozinho', body: text });
  }
}

module.exports = { notifyPartnerNudge };
