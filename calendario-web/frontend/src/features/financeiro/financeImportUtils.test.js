import { describe, expect, test } from 'vitest';
import { buildEntryRows, findInvalidRow, moveRowToSection } from './financeImportUtils.js';

const preview = {
  income: [{ description: 'Salário', amount: 5000, suggestedCategory: 'cat-salario' }],
  expenses: [{ description: 'Internet', amount: 120, suggestedCategory: 'cat-moradia' }],
  necessities: [{ description: 'Óculos', amount: 800, reason: 'grau mudou' }],
  wishes: [{ description: 'PS5', amount: 4000 }],
  skipped: [
    { sheet: 'Despesas mensais', description: 'Cartão sem valor', amount: null, why: 'sem valor numérico' },
    { sheet: 'Rascunho', description: 'Presente', amount: 250, why: 'fora de uma tabela "Item"/"Valor"' },
    { sheet: 'Despesas mensais', description: 'Pneu', amount: null, wishType: 'necessidade', why: 'sem valor numérico' },
  ],
};

describe('buildEntryRows', () => {
  test('traz todos os itens lidos da planilha, inclusive os não importados', () => {
    const rows = buildEntryRows(preview);

    expect(rows).toHaveLength(7);
    expect(rows.map((row) => row.description)).toEqual(
      expect.arrayContaining(['Salário', 'Internet', 'Óculos', 'PS5', 'Cartão sem valor', 'Presente', 'Pneu'])
    );
  });

  test('itens reconhecidos entram marcados e os descartados desmarcados', () => {
    const rows = buildEntryRows(preview);

    expect(rows.filter((row) => !row.skippedFrom).every((row) => row.included)).toBe(true);
    expect(rows.filter((row) => row.skippedFrom).every((row) => !row.included)).toBe(true);
  });

  test('guarda a origem do item descartado para mostrar na tela', () => {
    const presente = buildEntryRows(preview).find((row) => row.description === 'Presente');

    expect(presente.skippedFrom).toEqual({ sheet: 'Rascunho', why: 'fora de uma tabela "Item"/"Valor"' });
    expect(presente.amount).toBe('250');
  });

  test('item descartado sem valor vem com campo vazio para preencher', () => {
    const cartao = buildEntryRows(preview).find((row) => row.description === 'Cartão sem valor');

    expect(cartao.amount).toBe('');
    expect(cartao.sectionKey).toBe('expenses');
  });

  test('descartado que tinha tipo de planejamento cai na seção certa', () => {
    const pneu = buildEntryRows(preview).find((row) => row.description === 'Pneu');

    expect(pneu.sectionKey).toBe('necessities');
    expect(pneu.wishType).toBe('necessidade');
  });

  test('não quebra quando a planilha não tem itens descartados', () => {
    expect(buildEntryRows({ expenses: [{ description: 'Luz', amount: 90 }] })).toHaveLength(1);
  });
});

describe('moveRowToSection', () => {
  test('mover despesa para necessidade futura ajusta o wishType e mantém a categoria', () => {
    const row = buildEntryRows(preview).find((item) => item.description === 'Internet');
    const moved = moveRowToSection(row, 'necessities');

    expect(moved.sectionKey).toBe('necessities');
    expect(moved.wishType).toBe('necessidade');
    expect(moved.type).toBe('despesa');
    expect(moved.category).toBe('cat-moradia');
  });

  test('mover de despesa para renda troca o tipo e limpa a categoria', () => {
    const row = buildEntryRows(preview).find((item) => item.description === 'Internet');
    const moved = moveRowToSection(row, 'income');

    expect(moved.type).toBe('receita');
    expect(moved.wishType).toBeNull();
    expect(moved.category).toBe('');
  });

  test('seção desconhecida devolve a linha intacta', () => {
    const row = buildEntryRows(preview).find((item) => item.description === 'Internet');

    expect(moveRowToSection(row, 'inexistente')).toBe(row);
  });
});

describe('findInvalidRow', () => {
  test('acusa item marcado sem valor preenchido', () => {
    const rows = buildEntryRows(preview).map((row) => ({ ...row, included: true }));

    expect(findInvalidRow(rows).description).toBe('Cartão sem valor');
  });

  test('não acusa nada quando todos os marcados têm descrição e valor', () => {
    const rows = buildEntryRows(preview).filter((row) => !row.skippedFrom);

    expect(findInvalidRow(rows)).toBeUndefined();
  });
});
