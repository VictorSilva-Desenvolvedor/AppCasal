const User = require('../models/User');
const HabitCheckin = require('../models/HabitCheckin');
const { notifyPartner } = require('./notificationService');

// Avisa o parceiro quando o usuário registra check-in num hábito de casal e
// o parceiro ainda não fez o dele hoje. "Parceiro" = outro usuário marcado
// com includeInHabits (o app pode ter contas extras, ex. de teste, que não
// contam pra isso).
async function notifyPartnerNudge(checkin, habit) {
  const partner = await User.findOne({ _id: { $ne: checkin.user }, includeInHabits: true, team: habit.team });
  if (!partner) return;

  const alreadyDone = await HabitCheckin.exists({ habit: habit._id, user: partner._id, day: checkin.day });
  if (alreadyDone) return;

  const author = await User.findById(checkin.user, 'name');
  await notifyPartner({
    actorId: checkin.user,
    recipientId: partner._id,
    title: 'Empurrãozinho',
    body: `💪 ${author.name} já fez "${habit.name}" hoje. Sua vez!`,
    link: '/app/habitos',
    category: 'habit-nudge',
    settingsFlag: 'notifyOnHabitNudge',
  });
}

// Avisa o parceiro quando uma subtarefa de um hábito colaborativo é
// concluída e ainda restam outras subtarefas sem check-in no dia.
async function notifyCollaborativeNudge(checkin, habit) {
  const partner = await User.findOne({ _id: { $ne: checkin.user }, includeInHabits: true, team: habit.team });
  if (!partner) return;

  const activeSubtasks = habit.subtasks.filter((s) => s.active);
  const dayCheckins = await HabitCheckin.find({ habit: habit._id, day: checkin.day });
  const doneSubtaskIds = new Set(dayCheckins.map((c) => String(c.subtask)));
  const remaining = activeSubtasks.filter((s) => !doneSubtaskIds.has(String(s._id)));
  if (remaining.length === 0) return; // já completo, sem necessidade de avisar

  const author = await User.findById(checkin.user, 'name');
  await notifyPartner({
    actorId: checkin.user,
    recipientId: partner._id,
    title: 'Empurrãozinho',
    body: `💪 ${author.name} concluiu uma etapa de "${habit.name}". Faltam ${remaining.length}!`,
    link: '/app/habitos',
    category: 'habit-nudge',
    settingsFlag: 'notifyOnHabitNudge',
  });
}

module.exports = { notifyPartnerNudge, notifyCollaborativeNudge };
