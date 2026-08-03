const TaskItem = require('../models/TaskItem');
const { todayKeyInTimezone, addDaysToKey, dayOfWeekFromKey } = require('../utils/dayKey');

// Início da semana na SEGUNDA. dayKey.weekStartKey() existe, mas usa domingo —
// é o recorte do resumo semanal, não o do ciclo de tarefas. Por isso o helper
// local em vez de reaproveitar aquele.
function mondayStartKey(dayKey) {
  const dow = dayOfWeekFromKey(dayKey); // 0=Dom..6=Sáb
  return addDaysToKey(dayKey, dow === 0 ? -6 : 1 - dow);
}

function monthStartKey(dayKey) {
  return `${dayKey.slice(0, 7)}-01`;
}

// Compara PERÍODO, não dia do calendário: reseta todo item cujo último reset
// aconteceu antes do início do período atual. Como dayKey é YYYY-MM-DD, a
// ordem lexicográfica ($lt) é a ordem cronológica. O ganho sobre a versão
// antiga (que só resetava semanal "se hoje é segunda" e mensal "se hoje é dia
// 1") é o catch-up: se o processo estiver fora do ar naquele dia específico, o
// ciclo não passa em branco — a primeira execução seguinte reseta.
async function resetKind(kind, periodStart, todayKey) {
  const result = await TaskItem.updateMany(
    { kind, lastResetKey: { $ne: null, $lt: periodStart } },
    { $set: { completed: false, completedAt: null, lastResetKey: todayKey } }
  );
  return result.modifiedCount;
}

async function resetTaskItems() {
  const todayKey = todayKeyInTimezone();

  // Baseline dos itens sem histórico de reset (criados antes deste campo
  // existir, ou criados hoje): carimba a data SEM tocar em `completed`. Sem
  // isso, um item criado e concluído hoje seria desmarcado na primeira
  // execução — `lastResetKey: null` casaria com qualquer filtro de "antes do
  // período atual".
  await TaskItem.updateMany(
    { kind: { $ne: 'unica' }, lastResetKey: null },
    { $set: { lastResetKey: todayKey } }
  );

  // 'unica' nunca entra: nunca reseta sozinha.
  const diaria = await resetKind('diaria', todayKey, todayKey);
  const semanal = await resetKind('semanal', mondayStartKey(todayKey), todayKey);
  const mensal = await resetKind('mensal', monthStartKey(todayKey), todayKey);

  return { diaria, semanal, mensal };
}

// dayKey do último reset bem-sucedido neste processo. Só é gravado depois do
// await, pra uma falha poder ser retentada na requisição seguinte.
let lastRunKey = null;

// Usado no caminho de leitura (GET /task-items). O cron das 00:05 e o boot já
// cobrem o caso normal; isto é a terceira camada, pra garantir que quem abre a
// tela veja o dia zerado mesmo que o servidor tenha passado a virada do dia
// fora do ar. O guard em memória mantém o custo em, no máximo, uma passada por
// processo por dia.
async function ensureTaskItemsReset() {
  const todayKey = todayKeyInTimezone();
  if (lastRunKey === todayKey) return null;

  const result = await resetTaskItems();
  lastRunKey = todayKey;
  return result;
}

module.exports = { resetTaskItems, ensureTaskItemsReset };
