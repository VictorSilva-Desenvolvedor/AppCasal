// Autoriza tanto o Vercel Cron (que manda `Authorization: Bearer $CRON_SECRET`
// automaticamente) quanto um agendador externo como cron-job.org, usado pro
// lembrete de hábito por minuto — frequência que o plano Hobby não permite
// configurar via Vercel Cron (mínimo de 1x/dia).
function isAuthorizedCron(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = req.headers.authorization;
  if (authHeader === `Bearer ${secret}`) return true;

  if (req.query && req.query.secret === secret) return true;

  return false;
}

module.exports = { isAuthorizedCron };
