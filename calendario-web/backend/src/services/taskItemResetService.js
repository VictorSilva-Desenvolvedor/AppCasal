const TaskItem = require('../models/TaskItem');
const { todayKeyInTimezone, dayOfWeekFromKey } = require('../utils/dayKey');

// Roda 1x/dia (ver server.js). Idempotente por item via `lastResetKey`: se o
// cron disparar de novo no mesmo dia (ex.: reinício do servidor), o filtro
// `lastResetKey !== todayKey` já exclui itens já resetados hoje — evita
// apagar uma conclusão legítima feita depois do primeiro reset do dia.
// 'unica' nunca entra aqui — nunca reseta sozinha.
async function resetTaskItems() {
  const todayKey = todayKeyInTimezone();
  const isMonday = dayOfWeekFromKey(todayKey) === 1;
  const isFirstOfMonth = todayKey.slice(8, 10) === '01';

  const diaria = await TaskItem.updateMany(
    { kind: 'diaria', lastResetKey: { $ne: todayKey } },
    { $set: { completed: false, completedAt: null, lastResetKey: todayKey } }
  );

  let semanal = { modifiedCount: 0 };
  if (isMonday) {
    semanal = await TaskItem.updateMany(
      { kind: 'semanal', lastResetKey: { $ne: todayKey } },
      { $set: { completed: false, completedAt: null, lastResetKey: todayKey } }
    );
  }

  let mensal = { modifiedCount: 0 };
  if (isFirstOfMonth) {
    mensal = await TaskItem.updateMany(
      { kind: 'mensal', lastResetKey: { $ne: todayKey } },
      { $set: { completed: false, completedAt: null, lastResetKey: todayKey } }
    );
  }

  return { diaria: diaria.modifiedCount, semanal: semanal.modifiedCount, mensal: mensal.modifiedCount };
}

module.exports = { resetTaskItems };
