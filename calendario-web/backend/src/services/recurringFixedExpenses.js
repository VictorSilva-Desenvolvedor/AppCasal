const FinanceEntry = require('../models/FinanceEntry');

function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

async function generateForNewMonth(month, year, team) {
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevStart = new Date(prevYear, prevMonth - 1, 1);
  const prevEnd = new Date(prevYear, prevMonth, 1);

  const prevFixedEntries = await FinanceEntry.find({
    type: 'despesa',
    nature: 'fixa',
    team,
    date: { $gte: prevStart, $lt: prevEnd },
  }).sort({ date: -1 });

  const latestBySeries = new Map();
  for (const entry of prevFixedEntries) {
    const seriesKey = String(entry.recurringRootId || entry._id);
    if (!latestBySeries.has(seriesKey)) {
      latestBySeries.set(seriesKey, { entry, rootId: entry.recurringRootId || entry._id });
    }
  }

  const newStart = new Date(year, month - 1, 1);
  const newEnd = new Date(year, month, 1);
  const existingInNewMonth = await FinanceEntry.find({ nature: 'fixa', team, date: { $gte: newStart, $lt: newEnd } });
  const existingSeriesKeys = new Set(existingInNewMonth.map((e) => String(e.recurringRootId || e._id)));

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
      nature: 'fixa',
      recurringRootId: rootId,
      paidBy: entry.paidBy,
      sharedWith: entry.sharedWith,
      splitAmount: entry.splitAmount,
      creator: entry.creator,
      team,
    });
  }

  if (toCreate.length) await FinanceEntry.insertMany(toCreate);
}

module.exports = { generateForNewMonth };
