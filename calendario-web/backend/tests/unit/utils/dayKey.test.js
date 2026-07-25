const {
  todayKeyInTimezone,
  addDaysToKey,
  dayOfWeekFromKey,
  weekStartKey,
  daysBetweenKeys,
} = require('../../../src/utils/dayKey');

describe('addDaysToKey', () => {
  test('soma dias dentro do mesmo mes', () => {
    expect(addDaysToKey('2026-07-20', 3)).toBe('2026-07-23');
  });

  test('atravessa virada de mes', () => {
    expect(addDaysToKey('2026-01-30', 3)).toBe('2026-02-02');
  });

  test('atravessa virada de ano', () => {
    expect(addDaysToKey('2025-12-30', 3)).toBe('2026-01-02');
  });

  test('aceita delta negativo', () => {
    expect(addDaysToKey('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('dayOfWeekFromKey', () => {
  test('retorna 0 para domingo e 6 para sabado', () => {
    expect(dayOfWeekFromKey('2026-07-19')).toBe(0); // domingo
    expect(dayOfWeekFromKey('2026-07-25')).toBe(6); // sabado
  });
});

describe('weekStartKey', () => {
  test('retorna o proprio dia quando ja e domingo', () => {
    expect(weekStartKey('2026-07-19')).toBe('2026-07-19');
  });

  test('retorna o domingo anterior para qualquer outro dia da semana', () => {
    expect(weekStartKey('2026-07-25')).toBe('2026-07-19');
  });
});

describe('daysBetweenKeys', () => {
  test('calcula diferenca positiva entre datas', () => {
    expect(daysBetweenKeys('2026-07-01', '2026-07-15')).toBe(14);
  });

  test('calcula diferenca negativa quando toKey e anterior a fromKey', () => {
    expect(daysBetweenKeys('2026-07-15', '2026-07-01')).toBe(-14);
  });
});

describe('todayKeyInTimezone', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test('resolve o dia no fuso de Sao Paulo (UTC-3), nao em UTC', () => {
    // 2026-07-25T02:30:00Z ainda e 2026-07-24 as 23:30 em Sao Paulo
    jest.useFakeTimers().setSystemTime(new Date('2026-07-25T02:30:00.000Z'));
    expect(todayKeyInTimezone()).toBe('2026-07-24');
  });

  test('vira o dia junto com a meia-noite de Sao Paulo, nao a de UTC', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-25T03:30:00.000Z'));
    expect(todayKeyInTimezone()).toBe('2026-07-25');
  });
});
