const connectDB = require('../../calendario-web/backend/src/config/db');
const { checkAndSendHabitReminders } = require('../../calendario-web/backend/src/services/habitReminderService');
const { isAuthorizedCron } = require('../_lib/cronAuth');

// Precisa rodar a cada minuto pra bater com o `reminderTime` configurado em
// cada hábito — o plano Hobby da Vercel só permite Cron Jobs 1x/dia, então
// este endpoint não entra no vercel.json: um serviço externo (cron-job.org)
// deve chamá-lo a cada minuto com `?secret=<CRON_SECRET>`.
module.exports = async (req, res) => {
  if (!isAuthorizedCron(req)) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    await connectDB();
    const result = await checkAndSendHabitReminders();
    res.status(200).json({ ok: true, result });
  } catch (err) {
    console.error('Falha no cron de lembretes de hábito:', err);
    res.status(500).json({ ok: false, message: err.message });
  }
};
