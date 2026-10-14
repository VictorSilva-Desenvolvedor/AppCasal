import { describe, expect, it } from 'vitest';
import { parseMoneyInput } from './financeUtils.js';

describe('parseMoneyInput', () => {
  it('aceita vírgula decimal', () => {
    expect(parseMoneyInput('187,50')).toBe(187.5);
  });

  it('aceita ponto decimal', () => {
    expect(parseMoneyInput('187.50')).toBe(187.5);
  });

  it('trata ponto como milhar quando há vírgula', () => {
    expect(parseMoneyInput('1.234,56')).toBe(1234.56);
  });

  it('ignora espaços e R$', () => {
    expect(parseMoneyInput(' R$ 89,90 ')).toBe(89.9);
  });

  it('devolve NaN para texto inválido ou vazio', () => {
    expect(parseMoneyInput('')).toBeNaN();
    expect(parseMoneyInput('abc')).toBeNaN();
    expect(parseMoneyInput('1,2,3')).toBeNaN();
  });
});
