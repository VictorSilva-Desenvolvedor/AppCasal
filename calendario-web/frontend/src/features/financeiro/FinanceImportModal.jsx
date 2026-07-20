import { useState } from 'react';
import { Button, Field, Badge, Modal } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useToast } from '../../hooks/useToast.js';

const SECTIONS = [
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

function toDateInputValue(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function buildEntryRows(preview) {
  const rows = [];
  for (const section of SECTIONS) {
    for (const item of preview[section.key] || []) {
      rows.push({
        id: uid(),
        section: section.title,
        type: section.type,
        wishType: section.wishType,
        description: item.description,
        amount: String(item.amount),
        category: item.suggestedCategory || '',
        reason: item.reason || '',
        included: true,
      });
    }
  }
  return rows;
}

function buildGoalRows(preview) {
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

export function FinanceImportModal({ open, onClose, categories, monthYear, onImported }) {
  const { showToast } = useToast();
  const [file, setFile] = useState(null);
  const [importDate, setImportDate] = useState(() =>
    toDateInputValue(new Date(monthYear.year, monthYear.month - 1, 1))
  );
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [warnings, setWarnings] = useState([]);
  const [entryRows, setEntryRows] = useState(null);
  const [goalRows, setGoalRows] = useState(null);
  const [error, setError] = useState('');
  const [committing, setCommitting] = useState(false);

  function reset() {
    setFile(null);
    setWarnings([]);
    setEntryRows(null);
    setGoalRows(null);
    setError('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleReadFile(event) {
    event.preventDefault();
    if (!file) return;

    setError('');
    setLoadingPreview(true);
    try {
      const result = await api.previewFinanceImport(file);
      setEntryRows(buildEntryRows(result));
      setGoalRows(buildGoalRows(result));
      setWarnings(result.warnings || []);
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setLoadingPreview(false);
    }
  }

  function updateEntryRow(id, patch) {
    setEntryRows((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function updateGoalRow(id, patch) {
    setGoalRows((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  async function handleConfirm() {
    setError('');

    const includedEntries = entryRows.filter((row) => row.included);
    const includedGoals = goalRows.filter((row) => row.included);

    if (includedEntries.length === 0 && includedGoals.length === 0) {
      setError('Selecione ao menos um item para importar');
      return;
    }
    if (includedEntries.some((row) => !row.category)) {
      setError('Escolha uma categoria para todos os lançamentos selecionados');
      return;
    }

    const payload = {
      date: importDate,
      entries: includedEntries.map((row) => ({
        type: row.type,
        description: row.description.trim(),
        amount: Number(row.amount),
        category: row.category,
        wishType: row.wishType,
        reason: row.reason,
      })),
      goals: includedGoals.map((row) => ({
        name: row.name.trim(),
        type: row.type,
        targetAmount: Number(row.targetAmount) || 0,
        currentAmount: Number(row.currentAmount) || 0,
        totalInstallments: row.totalInstallments ? Number(row.totalInstallments) : null,
        installmentAmount: row.installmentAmount ? Number(row.installmentAmount) : null,
        paidInstallments: row.paidInstallments ? Number(row.paidInstallments) : 0,
        notes: row.notes,
      })),
    };

    setCommitting(true);
    try {
      const result = await api.commitFinanceImport(payload);
      showToast(
        `Importação concluída: ${result.entriesCreated} lançamento(s), ${result.goalsCreated} objetivo(s)`,
        'success'
      );
      await onImported();
      handleClose();
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setCommitting(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Importar planilha de orçamento">
      <div className="finance-import-body">
        {!entryRows && (
          <form onSubmit={handleReadFile} className="finance-import-body">
            <p className="finance-goal-form-hint">
              Envie o arquivo .xlsx do orçamento mensal (mesmo modelo da planilha "Renda mensal" / "Despesas
              mensais" / "Objetivos"). Nada é gravado ainda — a próxima tela mostra uma prévia para conferir.
            </p>
            <Field label="Arquivo (.xlsx)" htmlFor="finance-import-file">
              <input
                id="finance-import-file"
                type="file"
                accept=".xlsx"
                onChange={(event) => setFile(event.target.files[0] || null)}
              />
            </Field>
            <Field label="Data de referência dos lançamentos" htmlFor="finance-import-date">
              <input
                id="finance-import-date"
                type="date"
                value={importDate}
                onChange={(event) => setImportDate(event.target.value)}
              />
            </Field>
            <p className="error-text">{error}</p>
            <Button type="submit" loading={loadingPreview} disabled={!file}>
              Ler planilha
            </Button>
          </form>
        )}

        {entryRows && (
          <>
            {warnings.length > 0 && (
              <div className="finance-import-warnings">
                {warnings.map((warning) => (
                  <span key={warning}>⚠ {warning}</span>
                ))}
              </div>
            )}

            <Field label="Data de referência dos lançamentos" htmlFor="finance-import-date-2">
              <input
                id="finance-import-date-2"
                type="date"
                value={importDate}
                onChange={(event) => setImportDate(event.target.value)}
              />
            </Field>

            {SECTIONS.map((section) => {
              const rows = entryRows.filter((row) => row.section === section.title);
              if (rows.length === 0) return null;
              const sectionCategories = categories.filter((c) => c.type === section.type);

              return (
                <div key={section.key}>
                  <p className="finance-import-section-title">
                    {section.title} ({rows.length})
                  </p>
                  {rows.map((row) => (
                    <div key={row.id} className={`finance-import-row${row.included ? '' : ' is-excluded'}`}>
                      <input
                        type="checkbox"
                        checked={row.included}
                        onChange={(event) => updateEntryRow(row.id, { included: event.target.checked })}
                        title="Importar este item"
                      />
                      <input
                        type="text"
                        className="finance-import-row-desc"
                        value={row.description}
                        onChange={(event) => updateEntryRow(row.id, { description: event.target.value })}
                        disabled={!row.included}
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="finance-import-row-amount"
                        value={row.amount}
                        onChange={(event) => updateEntryRow(row.id, { amount: event.target.value })}
                        disabled={!row.included}
                      />
                      <select
                        className="finance-import-row-category"
                        value={row.category}
                        onChange={(event) => updateEntryRow(row.id, { category: event.target.value })}
                        disabled={!row.included}
                      >
                        <option value="">Categoria</option>
                        {sectionCategories.map((category) => (
                          <option key={category._id} value={category._id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      {row.reason && <span className="finance-import-row-badge">Motivo: {row.reason}</span>}
                    </div>
                  ))}
                </div>
              );
            })}

            {goalRows.length > 0 && (
              <div>
                <p className="finance-import-section-title">Objetivos ({goalRows.length})</p>
                {goalRows.map((row) => (
                  <div key={row.id} className={`finance-import-goal-row${row.included ? '' : ' is-excluded'}`}>
                    <div className="finance-import-goal-header">
                      <input
                        type="checkbox"
                        checked={row.included}
                        onChange={(event) => updateGoalRow(row.id, { included: event.target.checked })}
                        title="Importar este objetivo"
                      />
                      <input
                        type="text"
                        value={row.name}
                        onChange={(event) => updateGoalRow(row.id, { name: event.target.value })}
                        disabled={!row.included}
                      />
                      {row.confidence === 'estimated' && <Badge>estimado</Badge>}
                    </div>
                    <div className="finance-import-goal-grid">
                      <label>
                        Tipo
                        <select
                          value={row.type}
                          onChange={(event) => updateGoalRow(row.id, { type: event.target.value })}
                          disabled={!row.included}
                        >
                          <option value="poupanca">Poupança</option>
                          <option value="parcelamento">Parcelamento</option>
                        </select>
                      </label>
                      <label>
                        Valor-alvo
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={row.targetAmount}
                          onChange={(event) => updateGoalRow(row.id, { targetAmount: event.target.value })}
                          disabled={!row.included}
                        />
                      </label>
                      <label>
                        Valor atual
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={row.currentAmount}
                          onChange={(event) => updateGoalRow(row.id, { currentAmount: event.target.value })}
                          disabled={!row.included}
                        />
                      </label>
                      {row.type === 'parcelamento' && (
                        <>
                          <label>
                            Nº de parcelas
                            <input
                              type="number"
                              min="1"
                              value={row.totalInstallments}
                              onChange={(event) => updateGoalRow(row.id, { totalInstallments: event.target.value })}
                              disabled={!row.included}
                            />
                          </label>
                          <label>
                            Valor da parcela
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={row.installmentAmount}
                              onChange={(event) => updateGoalRow(row.id, { installmentAmount: event.target.value })}
                              disabled={!row.included}
                            />
                          </label>
                          <label>
                            Parcelas pagas
                            <input
                              type="number"
                              min="0"
                              value={row.paidInstallments}
                              onChange={(event) => updateGoalRow(row.id, { paidInstallments: event.target.value })}
                              disabled={!row.included}
                            />
                          </label>
                        </>
                      )}
                    </div>
                    {row.notes && <span className="finance-import-row-badge">Nota: {row.notes}</span>}
                    {row.warning && <span className="finance-import-goal-warning">{row.warning}</span>}
                  </div>
                ))}
              </div>
            )}

            <p className="error-text">{error}</p>

            <div className="finance-form-actions">
              <Button loading={committing} onClick={handleConfirm}>
                Confirmar importação
              </Button>
              <Button type="button" variant="secondary" onClick={reset} disabled={committing}>
                Ler outro arquivo
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
