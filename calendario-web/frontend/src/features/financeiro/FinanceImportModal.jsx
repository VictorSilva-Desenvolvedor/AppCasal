import { useState } from 'react';
import { Button, Field, Badge, Icon, Modal } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useToast } from '../../hooks/useToast.js';
import {
  IMPORT_SECTIONS as SECTIONS,
  buildEntryRows,
  buildGoalRows,
  findInvalidRow,
  moveRowToSection,
} from './financeImportUtils.js';

const SHEET_ROLES = [
  { value: 'renda', label: 'Renda (receitas)' },
  { value: 'despesas', label: 'Despesas' },
  { value: 'objetivos', label: 'Objetivos' },
  { value: 'ignorar', label: 'Ignorar' },
];

function toDateInputValue(date) {
  return new Date(date).toISOString().slice(0, 10);
}

export function FinanceImportModal({ open, onClose, categories, monthYear, onImported }) {
  const { showToast } = useToast();
  const [file, setFile] = useState(null);
  const [importDate, setImportDate] = useState(() =>
    toDateInputValue(new Date(monthYear.year, monthYear.month - 1, 1))
  );
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [warnings, setWarnings] = useState([]);
  const [sheets, setSheets] = useState([]);
  const [sheetsDirty, setSheetsDirty] = useState(false);
  const [entryRows, setEntryRows] = useState(null);
  const [goalRows, setGoalRows] = useState(null);
  const [showSkipped, setShowSkipped] = useState(false);
  const [error, setError] = useState('');
  const [committing, setCommitting] = useState(false);

  const skippedRows = entryRows?.filter((row) => row.skippedFrom) || [];
  const includedCount =
    (entryRows?.filter((row) => row.included).length || 0) + (goalRows?.filter((row) => row.included).length || 0);

  function reset() {
    setFile(null);
    setWarnings([]);
    setSheets([]);
    setSheetsDirty(false);
    setEntryRows(null);
    setGoalRows(null);
    setShowSkipped(false);
    setError('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function readFile(sheetRoles) {
    if (!file) return;

    setError('');
    setLoadingPreview(true);
    try {
      const result = await api.previewFinanceImport(file, sheetRoles);
      setSheets(result.sheets || []);
      setSheetsDirty(false);
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

  function handleSubmitFile(event) {
    event.preventDefault();
    readFile();
  }

  function handleReprocess() {
    readFile(Object.fromEntries(sheets.map((sheet) => [sheet.name, sheet.role])));
  }

  function updateSheetRole(name, role) {
    setSheets((current) => current.map((sheet) => (sheet.name === name ? { ...sheet, role } : sheet)));
    setSheetsDirty(true);
  }

  function updateEntryRow(id, patch) {
    setEntryRows((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function changeRowSection(row, sectionKey) {
    setEntryRows((rows) => rows.map((item) => (item.id === row.id ? moveRowToSection(item, sectionKey) : item)));
  }

  function updateGoalRow(id, patch) {
    setGoalRows((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function renderEntryRow(row) {
    return (
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
          placeholder="Valor"
          className="finance-import-row-amount"
          value={row.amount}
          onChange={(event) => updateEntryRow(row.id, { amount: event.target.value })}
          disabled={!row.included}
        />
        <select
          className="finance-import-row-section"
          value={row.sectionKey}
          onChange={(event) => changeRowSection(row, event.target.value)}
          disabled={!row.included}
          title="Mover para outra seção"
        >
          {SECTIONS.map((option) => (
            <option key={option.key} value={option.key}>
              {option.title}
            </option>
          ))}
        </select>
        <select
          className={`finance-import-row-category${row.category ? '' : ' is-undecided'}`}
          value={row.category}
          onChange={(event) => updateEntryRow(row.id, { category: event.target.value })}
          disabled={!row.included}
        >
          <option value="">Falta decidir</option>
          {categories
            .filter((category) => category.type === row.type)
            .map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
        </select>
        {row.skippedFrom && (
          <span className="finance-import-row-badge">
            Aba &quot;{row.skippedFrom.sheet}&quot; — {row.skippedFrom.why}
          </span>
        )}
        {row.reason && <span className="finance-import-row-badge">Motivo: {row.reason}</span>}
      </div>
    );
  }

  async function handleConfirm() {
    setError('');

    const includedEntries = entryRows.filter((row) => row.included);
    const includedGoals = goalRows.filter((row) => row.included);

    if (includedEntries.length === 0 && includedGoals.length === 0) {
      setError('Selecione ao menos um item para importar');
      return;
    }

    const invalid = findInvalidRow(includedEntries);
    if (invalid) {
      setError(`Preencha descrição e valor de "${invalid.description || 'item sem nome'}" antes de importar`);
      return;
    }

    const uncategorizedCount = includedEntries.filter((row) => !row.category).length;

    const payload = {
      date: importDate,
      entries: includedEntries.map((row) => ({
        type: row.type,
        description: row.description.trim(),
        amount: Number(row.amount),
        category: row.category || null,
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
      if (uncategorizedCount > 0) {
        showToast(
          `${uncategorizedCount} lançamento(s) importado(s) sem categoria — edite depois para organizar`,
          'warning'
        );
      }
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
          <form onSubmit={handleSubmitFile} className="finance-import-body">
            <p className="finance-goal-form-hint">
              Envie o arquivo .xlsx do orçamento. As abas são reconhecidas pelo nome (Renda / Despesas / Objetivos),
              mas na próxima tela você escolhe o papel de cada uma. Nada é gravado ainda — a prévia é só pra conferir.
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
            {sheets.length > 0 && (
              <div className="finance-import-sheets">
                <p className="finance-import-section-title">Abas da planilha</p>
                {sheets.map((sheet) => (
                  <div className="finance-import-sheet-row" key={sheet.name}>
                    <span className="finance-import-sheet-name">{sheet.name}</span>
                    <select
                      value={sheet.role}
                      onChange={(event) => updateSheetRole(sheet.name, event.target.value)}
                      disabled={loadingPreview}
                    >
                      {SHEET_ROLES.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
                {sheetsDirty && (
                  <div className="finance-import-sheets-actions">
                    <span className="finance-goal-form-hint">
                      Reler a planilha descarta os ajustes feitos na lista abaixo.
                    </span>
                    <Button type="button" variant="secondary" loading={loadingPreview} onClick={handleReprocess}>
                      Reprocessar com estas abas
                    </Button>
                  </div>
                )}
              </div>
            )}

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

            <p className="finance-import-counter">
              {includedCount} de {entryRows.length + goalRows.length} itens lidos da planilha serão importados
            </p>

            {SECTIONS.map((section) => {
              const rows = entryRows.filter((row) => !row.skippedFrom && row.sectionKey === section.key);
              if (rows.length === 0) return null;

              return (
                <div key={section.key}>
                  <p className="finance-import-section-title">
                    {section.title} ({rows.length})
                  </p>
                  {rows.map(renderEntryRow)}
                </div>
              );
            })}

            {skippedRows.length > 0 && (
              <div>
                <button
                  type="button"
                  className="finance-collapsible-toggle"
                  onClick={() => setShowSkipped((current) => !current)}
                >
                  <Icon name={showSkipped ? 'chevron-left' : 'chevron-right'} />
                  Lidos mas não importados automaticamente ({skippedRows.length})
                </button>
                {showSkipped && (
                  <div>
                    <p className="finance-goal-form-hint">
                      Estas linhas existem na planilha mas o leitor não soube onde encaixá-las. Marque, complete o
                      valor e escolha a seção pra trazer qualquer uma delas.
                    </p>
                    {skippedRows.map(renderEntryRow)}
                  </div>
                )}
              </div>
            )}

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
