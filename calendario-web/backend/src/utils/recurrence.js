const DAY_MS = 86_400_000;
const GUARD_MAX = 20000;

function toUTCDateOnly(date) {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addDaysUTC(date, days) {
  return new Date(date.getTime() + days * DAY_MS);
}

function lastDayOfMonthUTC(year, month) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function addMonthsClamped(date, months) {
  const day = date.getUTCDate();
  const totalMonths = date.getUTCMonth() + months;
  const year = date.getUTCFullYear() + Math.floor(totalMonths / 12);
  const month = ((totalMonths % 12) + 12) % 12;
  return new Date(Date.UTC(year, month, Math.min(day, lastDayOfMonthUTC(year, month))));
}

function addYearsClamped(date, years) {
  return addMonthsClamped(date, years * 12);
}

// Migração implícita: eventos antigos com `recurring: true` e sem recurrenceRule
// (ou com frequency 'none') são tratados como recorrência anual.
function normalizeRule(event) {
  const rule = event.recurrenceRule || {};
  if ((!rule.frequency || rule.frequency === 'none') && event.recurring) {
    return { frequency: 'yearly', interval: 1, daysOfWeek: [], endDate: null, endCount: null };
  }
  return {
    frequency: rule.frequency || 'none',
    interval: Math.max(1, rule.interval || 1),
    daysOfWeek: Array.isArray(rule.daysOfWeek) ? rule.daysOfWeek : [],
    endDate: rule.endDate || null,
    endCount: rule.endCount || null,
  };
}

/**
 * Invoca onOccurrence(date) para cada ocorrência do evento, em ordem cronológica,
 * a partir da data original. Interrompe antecipadamente se onOccurrence retornar false.
 */
function walkOccurrences(originalDate, rule, onOccurrence) {
  const original = toUTCDateOnly(originalDate);

  if (rule.frequency === 'none') {
    onOccurrence(original);
    return;
  }

  const endDate = rule.endDate ? toUTCDateOnly(rule.endDate) : null;
  const maxCount = rule.endCount || Infinity;
  const interval = rule.interval;

  if (rule.frequency === 'weekly') {
    const anchorSunday = addDaysUTC(original, -original.getUTCDay());
    const activeDays = rule.daysOfWeek.length
      ? [...new Set(rule.daysOfWeek)].sort((a, b) => a - b)
      : [original.getUTCDay()];

    let count = 0;
    for (let week = 0; week < GUARD_MAX; week += 1) {
      const weekStart = addDaysUTC(anchorSunday, week * 7 * interval);

      for (const dow of activeDays) {
        const candidate = addDaysUTC(weekStart, dow);
        if (candidate < original) continue;
        if (endDate && candidate > endDate) return;
        if (count >= maxCount) return;

        count += 1;
        if (onOccurrence(candidate) === false) return;
      }
    }
    return;
  }

  const nthCandidate = (n) => {
    if (rule.frequency === 'daily') return addDaysUTC(original, n * interval);
    if (rule.frequency === 'monthly') return addMonthsClamped(original, n * interval);
    return addYearsClamped(original, n * interval);
  };

  for (let n = 0; n < maxCount && n < GUARD_MAX; n += 1) {
    const candidate = nthCandidate(n);
    if (endDate && candidate > endDate) return;
    if (onOccurrence(candidate) === false) return;
  }
}

function getOccurrencesInRange(originalDate, rule, rangeStart, rangeEnd) {
  const start = toUTCDateOnly(rangeStart);
  const end = toUTCDateOnly(rangeEnd);
  const occurrences = [];

  walkOccurrences(originalDate, rule, (candidate) => {
    if (candidate > end) return false;
    if (candidate >= start) occurrences.push(candidate);
    return true;
  });

  return occurrences;
}

function getNextOccurrence(originalDate, rule, fromDate) {
  const from = toUTCDateOnly(fromDate);
  let found = null;

  walkOccurrences(originalDate, rule, (candidate) => {
    if (candidate >= from) {
      found = candidate;
      return false;
    }
    return true;
  });

  return found;
}

module.exports = { normalizeRule, getOccurrencesInRange, getNextOccurrence, toUTCDateOnly };
