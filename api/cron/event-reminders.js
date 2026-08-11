const connectDB = require('../../calendario-web/backend/src/config/db');
const { checkAndSendReminders } = require('../../calendario-web/backend/src/services/reminderService');
const { isAuthorizedCron } = require('../_lib/cronAuth');

// Vercel Cron (Hobby): 1x/dia, "0 11 * * *" = 08:00 em America/Sao_Paulo (UTC-3 fixo).
module.exports = async (req, res) => {
  if (!isAuthorizedCron(req)) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    await connectDB();
    const result = await checkAndSendReminders();
    res.status(200).json({ ok: true, result });
  } catch (err) {
    console.error('Falha no cron de lembretes de evento:', err);
    res.status(500).json({ ok: false, message: err.message });
  }
};
