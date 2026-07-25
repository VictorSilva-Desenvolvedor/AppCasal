const { deriveInstallmentAmount } = require('../../../src/services/financeGoalUtils');

describe('deriveInstallmentAmount', () => {
  test('usa installmentAmount explicito quando informado', () => {
    expect(deriveInstallmentAmount(1200, 12, 150)).toBe(150);
  });

  test('divide targetAmount por totalInstallments quando installmentAmount nao informado', () => {
    expect(deriveInstallmentAmount(1200, 12, null)).toBe(100);
  });

  test('retorna null quando nao ha totalInstallments nem installmentAmount', () => {
    expect(deriveInstallmentAmount(1200, null, null)).toBeNull();
  });

  test('retorna null quando totalInstallments e 0 (falsy)', () => {
    expect(deriveInstallmentAmount(1200, 0, null)).toBeNull();
  });
});
