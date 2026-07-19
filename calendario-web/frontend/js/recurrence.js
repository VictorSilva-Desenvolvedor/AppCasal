const GUARD_MAX = 20000;

function toLocalDateOnly(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
}

function addDaysLocal(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, 12, 0, 0);
}

function lastDayOfMonthLocal(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function addMonthsClamped(date, months) {
  const day = date.getDate();
  const totalMonths = date.getMonth() + months;
  const year = date.getFullYear() + Math.floor(totalMonths / 12);
  const month = ((totalMonths % 12) + 12) % 12;
  return new Date(year, month, Math.min(day, lastDayOfMonthLocal(year, month)), 12, 0, 0);
}

function addYearsClamped(date, years) {
  return addMonthsClamped(date, years * 12);
}

// Migração implícita: eventos antigos com `recurring: true` e sem recurrenceRule
// (ou com frequency 'none') são tratados como recorrência anual.
export function normalizeRule(event) {
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
  const original = toLocalDateOnly(originalDate);

  if (rule.frequency === 'none') {
    onOccurrence(original);
    return;
  }

  const endDate = rule.endDate ? toLocalDateOnly(rule.endDate) : null;
  const maxCount = rule.endCount || Infinity;
  const interval = rule.interval;

  if (rule.frequency === 'weekly') {
    const anchorSunday = addDaysLocal(original, -original.getDay());
    const activeDays = rule.daysOfWeek.length
      ? [...new Set(rule.daysOfWeek)].sort((a, b) => a - b)
      : [original.getDay()];

    let count = 0;
    for (let week = 0; week < GUARD_MAX; week += 1) {
      const weekStart = addDaysLocal(anchorSunday, week * 7 * interval);

      for (const dow of activeDays) {
        const candidate = addDaysLocal(weekStart, dow);
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
    if (rule.frequency === 'daily') return addDaysLocal(original, n * interval);
    if (rule.frequency === 'monthly') return addMonthsClamped(original, n * interval);
    return addYearsClamped(original, n * interval);
  };

  for (let n = 0; n < maxCount && n < GUARD_MAX; n += 1) {
    const candidate = nthCandidate(n);
    if (endDate && candidate > endDate) return;
    if (onOccurrence(candidate) === false) return;
  }
}

export function getOccurrencesInRange(originalDate, rule, rangeStart, rangeEnd) {
  const start = toLocalDateOnly(rangeStart);
  const end = toLocalDateOnly(rangeEnd);
  const occurrences = [];

  walkOccurrences(originalDate, rule, (candidate) => {
    if (candidate > end) return false;
    if (candidate >= start) occurrences.push(candidate);
    return true;
  });

  return occurrences;
}

export function getNextOccurrence(originalDate, rule, fromDate) {
  const from = toLocalDateOnly(fromDate);
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
