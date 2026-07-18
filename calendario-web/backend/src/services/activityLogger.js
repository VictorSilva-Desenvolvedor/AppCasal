const ActivityLog = require('../models/ActivityLog');

function formatDate(date) {
  return new Date(date).toLocaleDateString('pt-BR');
}

async function logActivity({ actor, action, event, eventTitle, details }) {
  try {
    await ActivityLog.create({
      actor,
      action,
      eventTitle: eventTitle || event?.title,
      eventId: action === 'deleted' ? null : event?._id,
      details,
    });
  } catch (err) {
    console.error('Falha ao registrar log de atividade:', err.message);
  }
}

function buildUpdateDetails(before, after) {
  const changes = [];

  if (before.title !== after.title) {
    changes.push(`Título: "${before.title}" → "${after.title}"`);
  }

  if ((before.description || '') !== (after.description || '')) {
    changes.push(`Descrição alterada`);
  }

  if (formatDate(before.date) !== formatDate(after.date)) {
    changes.push(`Data: ${formatDate(before.date)} → ${formatDate(after.date)}`);
  }

  if (Boolean(before.recurring) !== Boolean(after.recurring)) {
    changes.push(`Recorrência: ${before.recurring ? 'ativada' : 'desativada'} → ${after.recurring ? 'ativada' : 'desativada'}`);
  }

  if ((before.attachments || []).length !== (after.attachments || []).length) {
    changes.push(`Anexos: ${before.attachments.length} → ${after.attachments.length}`);
  }

  return changes.length > 0 ? changes.join('; ') : 'Nenhuma alteração de campo detectada';
}

module.exports = { logActivity, buildUpdateDetails, formatDate };
