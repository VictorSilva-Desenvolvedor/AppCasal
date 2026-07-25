const { normalizeRule, getOccurrencesInRange, getNextOccurrence, toUTCDateOnly } = require('../../../src/utils/recurrence');

function d(dateStr) {
  return new Date(dateStr);
}

function keys(dates) {
  return dates.map((dt) => dt.toISOString().slice(0, 10));
}

describe('normalizeRule', () => {
  test('migra recurring:true sem rule para anual', () => {
    const result = normalizeRule({ recurring: true });
    expect(result).toEqual({ frequency: 'yearly', interval: 1, daysOfWeek: [], endDate: null, endCount: null });
  });

  test('evento nao recorrente sem rule cai em frequency none', () => {
    const result = normalizeRule({ recurring: false });
    expect(result).toEqual({ frequency: 'none', interval: 1, daysOfWeek: [], endDate: null, endCount: null });
  });

  test('clampa interval invalido (0) para 1', () => {
    const result = normalizeRule({ recurrenceRule: { frequency: 'daily', interval: 0 } });
    expect(result.interval).toBe(1);
  });

  test('preserva daysOfWeek/endDate/endCount quando presentes', () => {
    const result = normalizeRule({
      recurrenceRule: { frequency: 'weekly', interval: 2, daysOfWeek: [1, 3], endDate: '2026-12-31', endCount: 5 },
    });
    expect(result).toEqual({ frequency: 'weekly', interval: 2, daysOfWeek: [1, 3], endDate: '2026-12-31', endCount: 5 });
  });
});

describe('getOccurrencesInRange', () => {
  test('daily com interval 2', () => {
    const rule = { frequency: 'daily', interval: 2, daysOfWeek: [], endDate: null, endCount: null };
    const occurrences = getOccurrencesInRange(d('2026-01-01'), rule, d('2026-01-01'), d('2026-01-10'));
    expect(keys(occurrences)).toEqual(['2026-01-01', '2026-01-03', '2026-01-05', '2026-01-07', '2026-01-09']);
  });

  test('weekly com daysOfWeek especificos (segunda e sexta)', () => {
    // 2026-01-05 e uma segunda-feira (getUTCDay()===1)
    const rule = { frequency: 'weekly', interval: 1, daysOfWeek: [1, 5], endDate: null, endCount: null };
    const occurrences = getOccurrencesInRange(d('2026-01-05'), rule, d('2026-01-05'), d('2026-01-18'));
    expect(keys(occurrences)).toEqual(['2026-01-05', '2026-01-09', '2026-01-12', '2026-01-16']);
  });

  test('monthly clampa dia 31 para o ultimo dia de fevereiro', () => {
    const rule = { frequency: 'monthly', interval: 1, daysOfWeek: [], endDate: null, endCount: null };
    const occurrences = getOccurrencesInRange(d('2026-01-31'), rule, d('2026-02-01'), d('2026-02-28'));
    expect(keys(occurrences)).toEqual(['2026-02-28']);
  });

  test('respeita endDate mesmo com range maior', () => {
    const rule = { frequency: 'daily', interval: 1, daysOfWeek: [], endDate: '2026-01-03', endCount: null };
    const occurrences = getOccurrencesInRange(d('2026-01-01'), rule, d('2026-01-01'), d('2026-01-10'));
    expect(keys(occurrences)).toEqual(['2026-01-01', '2026-01-02', '2026-01-03']);
  });

  test('respeita endCount mesmo com range maior', () => {
    const rule = { frequency: 'daily', interval: 1, daysOfWeek: [], endDate: null, endCount: 3 };
    const occurrences = getOccurrencesInRange(d('2026-01-01'), rule, d('2026-01-01'), d('2026-01-31'));
    expect(occurrences).toHaveLength(3);
  });
});

describe('getNextOccurrence', () => {
  test('encontra a proxima ocorrencia anual a partir de uma data', () => {
    const rule = { frequency: 'yearly', interval: 1, daysOfWeek: [], endDate: null, endCount: null };
    const next = getNextOccurrence(d('2020-03-15'), rule, d('2026-01-01'));
    expect(next.toISOString().slice(0, 10)).toBe('2026-03-15');
  });

  test('retorna null quando nao ha ocorrencia futura (frequency none)', () => {
    const rule = { frequency: 'none', interval: 1, daysOfWeek: [], endDate: null, endCount: null };
    const next = getNextOccurrence(d('2020-01-01'), rule, d('2026-01-01'));
    expect(next).toBeNull();
  });
});

describe('toUTCDateOnly', () => {
  test('remove componente de hora, mantendo o dia em UTC', () => {
    const result = toUTCDateOnly('2026-06-15T23:45:00.000Z');
    expect(result.toISOString()).toBe('2026-06-15T00:00:00.000Z');
  });
});
