const { checkAndSendReminders } = require('../services/reminderService');

async function runNow(req, res) {
  const result = await checkAndSendReminders();
  res.json({ message: 'Verificação de lembretes executada', ...result });
}

module.exports = { runNow };
