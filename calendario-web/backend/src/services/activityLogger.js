const ActivityLog = require('../models/ActivityLog');

const CATEGORY_LABELS = {
  trabalho: 'Trabalho',
  pessoal: 'Pessoal',
  saude: 'Saúde',
  aniversario: 'Aniversário',
  financeiro: 'Financeiro',
  outro: 'Outro',
};

const FREQUENCY_LABELS = {
  none: 'nenhuma',
  daily: 'diária',
  weekly: 'semanal',
  monthly: 'mensal',
  yearly: 'anual',
};

function formatDate(date) {
  return new Date(date).toLocaleDateString('pt-BR');
}

function categoryLabel(category) {
  return category ? CATEGORY_LABELS[category] || category : 'nenhuma';
}

function recurrenceLabel(rule) {
  if (!rule || rule.frequency === 'none') return 'nenhuma';
  const label = FREQUENCY_LABELS[rule.frequency] || rule.frequency;
  return rule.interval > 1 ? `${label} (a cada ${rule.interval})` : label;
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

  const beforeRecurrence = recurrenceLabel(before.recurrenceRule);
  const afterRecurrence = recurrenceLabel(after.recurrenceRule);
  if (beforeRecurrence !== afterRecurrence) {
    changes.push(`Recorrência: ${beforeRecurrence} → ${afterRecurrence}`);
  }

  if ((before.category || null) !== (after.category || null)) {
    changes.push(`Categoria: ${categoryLabel(before.category)} → ${categoryLabel(after.category)}`);
  }

  if ((before.attachments || []).length !== (after.attachments || []).length) {
    changes.push(`Anexos: ${before.attachments.length} → ${after.attachments.length}`);
  }

  return changes.length > 0 ? changes.join('; ') : 'Nenhuma alteração de campo detectada';
}

module.exports = { logActivity, buildUpdateDetails, formatDate };
