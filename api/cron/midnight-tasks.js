const connectDB = require('../../calendario-web/backend/src/config/db');
const { evaluateHabitStreaks } = require('../../calendario-web/backend/src/services/habitStreakService');
const { resetTaskItems } = require('../../calendario-web/backend/src/services/taskItemResetService');
const { isAuthorizedCron } = require('../_lib/cronAuth');

// Vercel Cron (Hobby): 1x/dia, "5 3 * * *" = 00:05 em America/Sao_Paulo (UTC-3 fixo).
module.exports = async (req, res) => {
  if (!isAuthorizedCron(req)) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    await connectDB();
    const [streaks, tasks] = await Promise.all([evaluateHabitStreaks(), resetTaskItems()]);
    res.status(200).json({ ok: true, streaks, tasks });
  } catch (err) {
    console.error('Falha no cron de tarefas da meia-noite:', err);
    res.status(500).json({ ok: false, message: err.message });
  }
};
