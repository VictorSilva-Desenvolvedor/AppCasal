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

// Avisa o parceiro quando uma subtarefa de um hábito colaborativo é
// concluída e ainda restam outras subtarefas sem check-in no dia.
async function notifyCollaborativeNudge(checkin, habit) {
  const partner = await User.findOne({ _id: { $ne: checkin.user } });
  if (!partner) return;

  const activeSubtasks = habit.subtasks.filter((s) => s.active);
  const dayCheckins = await HabitCheckin.find({ habit: habit._id, day: checkin.day });
  const doneSubtaskIds = new Set(dayCheckins.map((c) => String(c.subtask)));
  const remaining = activeSubtasks.filter((s) => !doneSubtaskIds.has(String(s._id)));
  if (remaining.length === 0) return; // já completo, sem necessidade de avisar

  const settings = await Settings.findOne({ user: partner._id });
  if (settings?.notifyOnHabitNudge === false) return;

  const author = await User.findById(checkin.user, 'name');
  const text = `💪 ${author.name} concluiu uma etapa de "${habit.name}". Faltam ${remaining.length}!`;
  const channel = settings?.notificationChannel || 'both';

  let delivered = false;
  if (channel !== 'push' && partner.whatsappNumber) {
    delivered = await sendWhatsappMessage(partner.whatsappNumber, text);
  }
  if (!delivered && channel !== 'whatsapp') {
    await sendPushNotification(partner._id, { title: 'Empurrãozinho', body: text });
  }
}

module.exports = { notifyPartnerNudge, notifyCollaborativeNudge };
