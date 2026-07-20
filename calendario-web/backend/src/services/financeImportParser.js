const ExcelJS = require('exceljs');

const OBJETIVOS_GRID_START_COL = 3; // C
const OBJETIVOS_GRID_END_COL = 14; // N
const OBJETIVOS_NOTES_START_COL = 15; // O

const CATEGORY_KEYWORDS = [
  [/sal[áa]rio/, 'Salário'],
  [/internet|luz|[áa]gua|aluguel|condom[íi]nio|\bgas\b/, 'Moradia'],
  [/gasolina|uber|[oô]nibus|moto|combust[íi]vel|transporte/, 'Transporte'],
  [/netflix|spotify|assinatura|ifood|streaming/, 'Assinaturas'],
  [/mercado|aliment|comida|restaurante|lanche|amendoim/, 'Alimentação'],
  [/academia|farm[áa]c|m[ée]dic|sa[úu]de|dentista|[oó]culos/, 'Saúde'],
  [/parcela|financiamento|empr[ée]stimo/, 'Financiamento'],
  [/faculdade|curso|escola|educa[çc][ãa]o/, 'Educação'],
];

function normalize(text) {
  return String(text ?? '')
    .trim()
    .toLowerCase();
}

function colLetterToNumber(letters) {
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}

function cellRawValue(cell) {
  const v = cell?.value;
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return v.trim() === '' ? null : v.trim();
  if (typeof v === 'object') {
    if (v.richText) {
      const text = v.richText.map((r) => r.text).join('').trim();
      return text === '' ? null : text;
    }
    if (typeof v.result === 'number') return v.result;
    if (typeof v.result === 'string') return v.result.trim() === '' ? null : v.result.trim();
  }
  return null;
}

function cellText(cell) {
  const v = cellRawValue(cell);
  return v === null ? '' : String(v);
}

function cellNumber(cell) {
  const v = cellRawValue(cell);
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function findWorksheet(workbook, pattern) {
  return workbook.worksheets.find((ws) => pattern.test(ws.name));
}

/**
 * Localiza tabelas "Item"/"Valor" numa worksheet varrendo o texto dos
 * cabeçalhos, em vez de depender das Tabelas nomeadas do Excel (que o
 * ExcelJS não expõe de forma confiável na leitura). Cobre tanto a tabela
 * principal (col B) quanto qualquer tabela lateral (ex. col K) no mesmo
 * padrão Item/Valor/Pago/+coluna livre.
 */
function findItemValueTables(worksheet) {
  const headers = [];
  // `actualRowCount`/`actualColumnCount` contam linhas/colunas não-vazias e
  // podem ser MENORES que o maior número de linha usado quando há linhas em
  // branco no meio (ex. linha de espaçamento entre tabelas) — usar sempre o
  // `rowCount`/`columnCount` baseados na dimensão da planilha.
  const lastRow = worksheet.rowCount;
  const lastCol = worksheet.columnCount;

  for (let r = 1; r <= lastRow; r++) {
    const row = worksheet.getRow(r);
    for (let c = 1; c <= lastCol; c++) {
      if (normalize(cellText(row.getCell(c))) !== 'item') continue;
      if (normalize(cellText(row.getCell(c + 1))) !== 'valor') continue;

      const reasonHeader = normalize(cellText(row.getCell(c + 3)));
      const wishType = reasonHeader.includes('necessidade')
        ? 'necessidade'
        : reasonHeader.includes('quer')
          ? 'desejo'
          : null;
      const hasReason = reasonHeader.startsWith('por que');

      headers.push({ row: r, itemCol: c, valorCol: c + 1, reasonCol: c + 3, wishType, hasReason });
    }
  }

  const headerRows = headers.map((h) => h.row).sort((a, b) => a - b);

  return headers.map((header) => {
    // Cada tabela vai até a linha imediatamente antes do próximo cabeçalho
    // "Item"/"Valor" encontrado na planilha (em qualquer coluna) — evita que
    // o leitor "vaze" para dentro da próxima tabela ao passar por uma linha
    // de título de seção (texto na coluna Item, sem valor numérico).
    const nextHeaderRow = headerRows.find((r) => r > header.row);
    const tableEndRow = nextHeaderRow ? nextHeaderRow - 1 : lastRow;

    const items = [];
    for (let r = header.row + 1; r <= tableEndRow; r++) {
      const row = worksheet.getRow(r);
      const description = cellText(row.getCell(header.itemCol)).trim();
      if (!description || normalize(description) === 'total') continue;

      const amount = cellNumber(row.getCell(header.valorCol));
      if (amount === null) continue;

      const reason = header.hasReason ? cellText(row.getCell(header.reasonCol)).trim() : '';
      items.push({ description, amount, wishType: header.wishType, reason });
    }
    return { ...header, items };
  });
}

function parseIncomeAndExpenses(workbook, warnings) {
  const income = [];
  const expenses = [];
  const necessities = [];
  const wishes = [];

  const incomeSheet = findWorksheet(workbook, /renda/i);
  if (!incomeSheet) {
    warnings.push('Não encontrei nenhuma aba com "Renda" no nome — nenhuma receita foi importada.');
  } else {
    const tables = findItemValueTables(incomeSheet);
    if (tables.length === 0 || tables.every((t) => t.items.length === 0)) {
      warnings.push(`Não encontrei uma tabela "Item"/"Valor" com dados na aba "${incomeSheet.name}".`);
    }
    tables.forEach((table) => income.push(...table.items.map(({ description, amount }) => ({ description, amount }))));
  }

  const expensesSheet = findWorksheet(workbook, /despesa/i);
  if (!expensesSheet) {
    warnings.push('Não encontrei nenhuma aba com "Despesas" no nome — nenhuma despesa foi importada.');
  } else {
    const tables = findItemValueTables(expensesSheet);
    if (tables.length === 0 || tables.every((t) => t.items.length === 0)) {
      warnings.push(`Não encontrei nenhuma tabela "Item"/"Valor" com dados na aba "${expensesSheet.name}".`);
    }
    for (const table of tables) {
      for (const item of table.items) {
        if (item.wishType === 'necessidade') necessities.push(item);
        else if (item.wishType === 'desejo') wishes.push(item);
        else expenses.push(item);
      }
    }
  }

  return { income, expenses, necessities, wishes };
}

function buildMergeIndex(worksheet) {
  const index = new Map();
  for (const range of worksheet.model.merges || []) {
    const match = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/.exec(range);
    if (!match) continue;
    const [, c1, r1, c2, r2] = match;
    if (r1 !== r2) continue; // este template só usa merges dentro de uma única linha
    const row = Number(r1);
    if (!index.has(row)) index.set(row, []);
    index.get(row).push([colLetterToNumber(c1), colLetterToNumber(c2)]);
  }
  return index;
}

const PLAIN_NUMBER_RE = /^-?\d+(\.\d+)?$/;

// Na grade de "Objetivos" alguns números aparecem digitados como texto (ex.
// contador de parcela "1".."9" salvo como string, mas "10","11","12" como
// número de verdade, no mesmo arquivo real) — normaliza pra número aqui,
// só neste contexto de grade, sem afetar a leitura das tabelas Item/Valor.
function toNumericIfPossible(value) {
  if (typeof value === 'string' && PLAIN_NUMBER_RE.test(value.trim())) {
    return Number(value.trim());
  }
  return value;
}

function rowSegments(worksheet, mergeIndex, rowNumber, startCol, endCol) {
  const merges = mergeIndex.get(rowNumber) || [];
  const row = worksheet.getRow(rowNumber);
  const segments = [];
  let col = startCol;

  while (col <= endCol) {
    const merge = merges.find(([s]) => s === col);
    const spanEnd = merge ? merge[1] : col;
    const value = toNumericIfPossible(cellRawValue(row.getCell(col)));
    if (value !== null) segments.push(value);
    col = spanEnd + 1;
  }

  return segments;
}

const TITLE_AMOUNTS_RE = /^(.*?)\s*\(([\d.,]+)\)(?:\s*atual\s*\(([\d.,]+)\)\s*)?$/i;

function parseAmountFromText(text) {
  if (!text) return null;
  const digits = text.replace(/[^\d]/g, '');
  return digits ? Number(digits) : null;
}

/**
 * A aba "Objetivos" não é uma tabela — é um layout visual livre (título
 * mesclado por objetivo + grade de células numéricas usada como progresso).
 * O parser é best-effort: usa o texto do próprio título como fonte de
 * verdade primária (ex. "Casinha objetivos (12.000) atual(2,390)") e cruza
 * blocos de "contador de parcela" (1,2,3...N) com despesas do tipo
 * "Item (n/N)" já lidas, em vez de tentar ler cor/estilo de célula.
 */
function parseGoals(workbook, expenseItems, warnings) {
  const sheet = findWorksheet(workbook, /objetivo/i);
  if (!sheet) {
    warnings.push('Não encontrei nenhuma aba com "Objetivos" no nome — nenhum objetivo foi importado.');
    return [];
  }

  const mergeIndex = buildMergeIndex(sheet);
  const lastRow = sheet.rowCount;

  const blocks = [];
  let current = null;

  for (let r = 1; r <= lastRow; r++) {
    const segments = rowSegments(sheet, mergeIndex, r, OBJETIVOS_GRID_START_COL, OBJETIVOS_GRID_END_COL);
    const isTitleRow = segments.length === 1 && typeof segments[0] === 'string';
    const numericValues = segments.filter((v) => typeof v === 'number');

    if (isTitleRow) {
      if (current) blocks.push(current);
      current = { title: segments[0].trim(), startRow: r, endRow: r, values: [] };
    } else if (current && numericValues.length > 0) {
      current.values.push(...numericValues);
      current.endRow = r;
    }
  }
  if (current) blocks.push(current);

  if (blocks.length === 0) {
    warnings.push(`Não encontrei nenhum bloco de objetivo reconhecível na aba "${sheet.name}".`);
    return [];
  }

  const installmentExpenseRe = /^(.*?)\s*\((\d+)\/(\d+)\)\s*$/;
  const parsedInstallmentExpenses = expenseItems
    .map((item) => {
      const match = installmentExpenseRe.exec(item.description);
      if (!match) return null;
      return { current: Number(match[2]), total: Number(match[3]), amount: item.amount };
    })
    .filter(Boolean);

  return blocks.map((block) => {
    const notes = findBlockNotes(sheet, mergeIndex, block);
    const titleMatch = TITLE_AMOUNTS_RE.exec(block.title);
    const name = (titleMatch ? titleMatch[1] : block.title).trim();
    const titleTarget = titleMatch ? parseAmountFromText(titleMatch[2]) : null;
    const titleCurrent = titleMatch && titleMatch[3] ? parseAmountFromText(titleMatch[3]) : null;

    const isInstallmentCounter =
      block.values.length > 0 && block.values.every((v, i) => v === i + 1);

    if (isInstallmentCounter) {
      const totalInstallments = block.values.length;
      const matches = parsedInstallmentExpenses.filter((m) => m.total === totalInstallments);

      if (matches.length > 0) {
        const earliest = matches.reduce((min, m) => (m.current < min.current ? m : min));
        return {
          name,
          type: 'parcelamento',
          targetAmount: totalInstallments * earliest.amount,
          currentAmount: 0,
          totalInstallments,
          installmentAmount: earliest.amount,
          paidInstallments: Math.max(earliest.current - 1, 0),
          notes,
          confidence: 'high',
        };
      }

      return {
        name,
        type: 'parcelamento',
        targetAmount: titleTarget || 0,
        currentAmount: 0,
        totalInstallments,
        installmentAmount: null,
        paidInstallments: 0,
        notes,
        confidence: 'estimated',
        warning: `Não consegui confirmar o valor da parcela de "${name}" — preencha manualmente.`,
      };
    }

    const gridMax = block.values.length > 0 ? Math.max(...block.values) : null;
    const targetAmount = titleTarget ?? gridMax;
    const hasCurrent = titleCurrent !== null;

    return {
      name,
      type: 'poupanca',
      targetAmount: targetAmount || 0,
      currentAmount: hasCurrent ? titleCurrent : 0,
      totalInstallments: null,
      installmentAmount: null,
      paidInstallments: 0,
      notes,
      confidence: targetAmount !== null && hasCurrent ? 'high' : 'estimated',
      warning:
        targetAmount === null
          ? `Não consegui determinar o valor-alvo de "${name}" — preencha manualmente.`
          : !hasCurrent
            ? `Não consegui determinar o valor atual de "${name}" — confira antes de importar.`
            : undefined,
    };
  });
}

function findBlockNotes(sheet, mergeIndex, block) {
  const lastCol = sheet.columnCount;
  if (lastCol < OBJETIVOS_NOTES_START_COL) return '';

  for (let r = block.startRow; r <= block.endRow; r++) {
    const segments = rowSegments(sheet, mergeIndex, r, OBJETIVOS_NOTES_START_COL, lastCol);
    const text = segments.find((v) => typeof v === 'string');
    if (text) return text.trim();
  }
  return '';
}

async function parseBudgetWorkbook(buffer) {
  const workbook = new ExcelJS.Workbook();
  const warnings = [];

  try {
    await workbook.xlsx.load(buffer);
  } catch (err) {
    const error = new Error('Não foi possível ler o arquivo — verifique se é um .xlsx válido');
    error.status = 400;
    throw error;
  }

  const { income, expenses, necessities, wishes } = parseIncomeAndExpenses(workbook, warnings);
  const allExpenseItems = [...expenses, ...necessities, ...wishes];
  const goals = parseGoals(workbook, allExpenseItems, warnings);

  return { income, expenses, necessities, wishes, goals, warnings };
}

function suggestCategory(description, categories, type) {
  const desc = normalize(description);
  for (const [regex, name] of CATEGORY_KEYWORDS) {
    if (regex.test(desc)) {
      const match = categories.find((c) => c.name === name && c.type === type);
      if (match) return match._id.toString();
    }
  }
  const fallback = categories.find((c) => c.name === 'Outros' && c.type === type);
  return fallback ? fallback._id.toString() : null;
}

module.exports = { parseBudgetWorkbook, suggestCategory };
