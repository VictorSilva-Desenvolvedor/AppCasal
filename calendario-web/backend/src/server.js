require('dotenv').config();

const cron = require('node-cron');
const connectDB = require('./config/db');
const app = require('./app');
const { checkAndSendReminders } = require('./services/reminderService');
const { checkAndSendHabitReminders } = require('./services/habitReminderService');
const { evaluateHabitStreaks } = require('./services/habitStreakService');
const { resetTaskItems } = require('./services/taskItemResetService');

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));

    // Recupera o ciclo perdido se o processo estava fora do ar na hora do cron
    // (deploy, restart, queda) — o reset é idempotente por dayKey.
    resetTaskItems().catch((err) => console.error('Falha ao resetar tarefas no boot:', err.message));

    cron.schedule(
      '0 8 * * *',
      () => {
        checkAndSendReminders().catch((err) => console.error('Falha ao verificar lembretes:', err.message));
      },
      { timezone: 'America/Sao_Paulo' }
    );

    cron.schedule(
      '* * * * *',
      () => {
        checkAndSendHabitReminders().catch((err) => console.error('Falha ao verificar lembretes de hábito:', err.message));
      },
      { timezone: 'America/Sao_Paulo' }
    );

    cron.schedule(
      '5 0 * * *',
      () => {
        evaluateHabitStreaks().catch((err) => console.error('Falha ao avaliar streaks de hábito:', err.message));
      },
      { timezone: 'America/Sao_Paulo' }
    );

    cron.schedule(
      '5 0 * * *',
      () => {
        resetTaskItems().catch((err) => console.error('Falha ao resetar tarefas:', err.message));
      },
      { timezone: 'America/Sao_Paulo' }
    );
  })
  .catch((err) => {
    console.error('Falha ao conectar no MongoDB:', err.message);
    process.exit(1);
  });
