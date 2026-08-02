export const IMPORT_SECTIONS = [
  { key: 'income', title: 'Renda mensal', type: 'receita', wishType: null },
  { key: 'expenses', title: 'Despesas do mês', type: 'despesa', wishType: null },
  { key: 'necessities', title: 'Necessidades futuras', type: 'despesa', wishType: 'necessidade' },
  { key: 'wishes', title: 'Desejos futuros', type: 'despesa', wishType: 'desejo' },
];

let uidCounter = 0;
function uid() {
  uidCounter += 1;
  return `row-${uidCounter}`;
}

/**
 * Monta as linhas editáveis da prévia. Além do que o leitor casou com cada
 * seção, traz também `preview.skipped` — as linhas que ele achou na planilha
 * mas não soube importar — desmarcadas, pra que nada seja engolido em silêncio.
 */
export function buildEntryRows(preview) {
  const rows = [];

  for (const section of IMPORT_SECTIONS) {
    for (const item of preview[section.key] || []) {
      rows.push({
        id: uid(),
        sectionKey: section.key,
        type: section.type,
        wishType: section.wishType,
        description: item.description,
        amount: String(item.amount),
        category: item.suggestedCategory || '',
        reason: item.reason || '',
        included: true,
        skippedFrom: null,
      });
    }
  }

  for (const item of preview.skipped || []) {
    const section =
      IMPORT_SECTIONS.find((option) => option.wishType && option.wishType === item.wishType) ||
      IMPORT_SECTIONS.find((option) => option.key === 'expenses');
    rows.push({
      id: uid(),
      sectionKey: section.key,
      type: section.type,
      wishType: section.wishType,
      description: item.description,
      amount: item.amount === null || item.amount === undefined ? '' : String(item.amount),
      category: item.suggestedCategory || '',
      reason: item.reason || '',
      included: false,
      skippedFrom: { sheet: item.sheet, why: item.why },
    });
  }

  return rows;
}

export function buildGoalRows(preview) {
  return (preview.goals || []).map((goal) => ({
    id: uid(),
    included: true,
    name: goal.name,
    type: goal.type,
    targetAmount: String(goal.targetAmount ?? ''),
    currentAmount: String(goal.currentAmount ?? 0),
    totalInstallments: goal.totalInstallments ? String(goal.totalInstallments) : '',
    installmentAmount: goal.installmentAmount ? String(goal.installmentAmount) : '',
    paidInstallments: goal.paidInstallments ? String(goal.paidInstallments) : '',
    notes: goal.notes || '',
    confidence: goal.confidence,
    warning: goal.warning,
  }));
}

// Trocar de seção troca também o tipo do lançamento (receita/despesa) e o
// planejamento futuro — a categoria sugerida só vale dentro do mesmo tipo.
export function moveRowToSection(row, sectionKey) {
  const section = IMPORT_SECTIONS.find((item) => item.key === sectionKey);
  if (!section) return row;
  return {
    ...row,
    sectionKey: section.key,
    type: section.type,
    wishType: section.wishType,
    category: section.type === row.type ? row.category : '',
  };
}

/**
 * Cruza o que o leitor extraiu com as células de origem, pra pintar na grade
 * da planilha o que entrou, o que ficou de fora e onde estão os objetivos.
 */
export function buildSheetHighlights(preview) {
  const map = new Map();

  function forSheet(name) {
    if (!map.has(name)) {
      map.set(name, { imported: new Set(), skipped: new Set(), goalRows: new Set() });
    }
    return map.get(name);
  }

  const imported = IMPORT_SECTIONS.flatMap((section) => preview[section.key] || []);
  for (const item of imported) {
    if (!item.origin?.sheet) continue;
    const entry = forSheet(item.origin.sheet);
    entry.imported.add(`${item.origin.row}:${item.origin.itemCol}`);
    entry.imported.add(`${item.origin.row}:${item.origin.valorCol}`);
  }

  for (const item of preview.skipped || []) {
    if (!item.origin?.sheet) continue;
    const entry = forSheet(item.origin.sheet);
    entry.skipped.add(`${item.origin.row}:${item.origin.itemCol}`);
  }

  for (const goal of preview.goals || []) {
    if (!goal.origin?.sheet) continue;
    const entry = forSheet(goal.origin.sheet);
    for (let row = goal.origin.startRow; row <= goal.origin.endRow; row++) {
      entry.goalRows.add(row);
    }
  }

  return map;
}

export function colLabel(n) {
  let label = '';
  let value = n;
  while (value > 0) {
    const rest = (value - 1) % 26;
    label = String.fromCharCode(65 + rest) + label;
    value = Math.floor((value - 1) / 26);
  }
  return label;
}

// Uma célula mesclada é desenhada só na âncora (com colSpan/rowSpan); as demais
// que ela cobre não viram <td>, senão a tabela sai torta.
export function buildMergeMaps(merges = []) {
  const anchors = new Map();
  const covered = new Set();

  for (const merge of merges) {
    anchors.set(`${merge.r1}:${merge.c1}`, {
      rowSpan: merge.r2 - merge.r1 + 1,
      colSpan: merge.c2 - merge.c1 + 1,
    });
    for (let r = merge.r1; r <= merge.r2; r++) {
      for (let c = merge.c1; c <= merge.c2; c++) {
        if (r !== merge.r1 || c !== merge.c1) covered.add(`${r}:${c}`);
      }
    }
  }

  return { anchors, covered };
}

export function findInvalidRow(rows) {
  return rows.find(
    (row) => !row.description.trim() || row.amount === '' || !Number.isFinite(Number(row.amount))
  );
}
