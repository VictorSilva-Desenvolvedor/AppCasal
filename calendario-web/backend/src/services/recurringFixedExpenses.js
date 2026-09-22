const FinanceEntry = require('../models/FinanceEntry');
const FinanceMonth = require('../models/FinanceMonth');

const FIXED_NATURES = ['fixa', 'a_decidir'];

function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

// Idempotente: pode rodar a cada acesso. Replica pro mês informado as despesas
// fixas de meses anteriores que ainda não existem nele e que ainda não foram
// geradas antes (`alreadyGenerated`). Retorna as chaves de série geradas.
async function generateForNewMonth(month, year, team, alreadyGenerated = []) {
  const newStart = new Date(year, month - 1, 1);

  // Olha todo o histórico anterior (não só o mês passado): se a corrente
  // quebrou em algum mês, o fixo volta a partir do lançamento mais recente
  // da série. Considera todas as naturezas pra respeitar quem desmarcou o
  // fixo depois (a última ocorrência deixa de ser fixa e a série termina).
  const previousEntries = await FinanceEntry.find({
    type: 'despesa',
    team,
    date: { $lt: newStart },
  }).sort({ date: -1 });

  const latestBySeries = new Map();
  for (const entry of previousEntries) {
    const seriesKey = String(entry.recurringRootId || entry._id);
    if (!latestBySeries.has(seriesKey)) {
      latestBySeries.set(seriesKey, { entry, rootId: entry.recurringRootId || entry._id });
    }
  }
  for (const [seriesKey, { entry }] of latestBySeries) {
    if (!FIXED_NATURES.includes(entry.nature)) latestBySeries.delete(seriesKey);
  }

  // Série gerada num mês posterior à última ocorrência e depois apagada:
  // alguém encerrou o fixo de propósito, então não ressuscita.
  const laterMonths = await FinanceMonth.find({ team, 'generatedSeries.0': { $exists: true } });
  for (const [seriesKey, { entry }] of latestBySeries) {
    const lastKey = entry.date.getFullYear() * 12 + entry.date.getMonth();
    const deletedLater = laterMonths.some((m) => {
      const key = m.year * 12 + (m.month - 1);
      return key > lastKey && key < year * 12 + (month - 1)
        && m.generatedSeries.some((id) => String(id) === seriesKey);
    });
    if (deletedLater) latestBySeries.delete(seriesKey);
  }

  const newEnd = new Date(year, month, 1);
  // Todas as naturezas: uma cópia que foi desmarcada como fixa neste mês
  // continua ocupando a série e não deve ser recriada.
  const existingInNewMonth = await FinanceEntry.find({
    type: 'despesa',
    team,
    date: { $gte: newStart, $lt: newEnd },
  });
  const existingSeriesKeys = new Set(existingInNewMonth.map((e) => String(e.recurringRootId || e._id)));
  for (const key of alreadyGenerated) existingSeriesKeys.add(String(key));

  const toCreate = [];
  for (const [seriesKey, { entry, rootId }] of latestBySeries) {
    if (existingSeriesKeys.has(seriesKey)) continue;
    const day = Math.min(entry.date.getDate(), daysInMonth(month, year));
    toCreate.push({
      type: 'despesa',
      description: entry.description,
      amount: entry.amount,
      category: entry.category,
      date: new Date(year, month - 1, day),
      paidAmount: 0,
      wishType: null,
      reason: entry.reason,
      nature: entry.nature,
      recurringRootId: rootId,
      linkedGoal: entry.linkedGoal,
      goalSynced: false,
      paidBy: entry.paidBy,
      sharedWith: entry.sharedWith,
      splitAmount: entry.splitAmount,
      creator: entry.creator,
      team,
    });
  }

  if (toCreate.length) await FinanceEntry.insertMany(toCreate);
  return toCreate.map((e) => e.recurringRootId);
}

module.exports = { generateForNewMonth };
