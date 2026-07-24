const TIMEZONE = 'America/Sao_Paulo';

// node-cron's `timezone` option só controla QUANDO o callback dispara, não o
// que `new Date()` retorna dentro dele — por isso resolvemos o dia atual
// explicitamente no fuso do app, em vez de confiar no relógio local do processo.
function todayKeyInTimezone(tz = TIMEZONE) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

// Aritmética em Date.UTC (não Date local) — o processo do servidor pode rodar
// em qualquer timezone do SO, então construímos/lemos sempre em UTC pra não
// depender disso; day keys são "datas puras", sem componente de hora.
function addDaysToKey(dayKey, delta) {
  const [y, m, d] = dayKey.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + delta);
  const yy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function dayOfWeekFromKey(dayKey) {
  const [y, m, d] = dayKey.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=Dom..6=Sáb
}

function weekStartKey(dayKey) {
  return addDaysToKey(dayKey, -dayOfWeekFromKey(dayKey));
}

function dayKeyFromDate(date, tz = TIMEZONE) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function daysBetweenKeys(fromKey, toKey) {
  const [fy, fm, fd] = fromKey.split('-').map(Number);
  const [ty, tm, td] = toKey.split('-').map(Number);
  const from = Date.UTC(fy, fm - 1, fd);
  const to = Date.UTC(ty, tm - 1, td);
  return Math.round((to - from) / 86400000);
}

module.exports = { todayKeyInTimezone, addDaysToKey, dayOfWeekFromKey, weekStartKey, daysBetweenKeys };
