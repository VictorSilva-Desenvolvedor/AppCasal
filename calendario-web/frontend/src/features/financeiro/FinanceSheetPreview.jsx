import { useState } from 'react';
import { buildMergeMaps, colLabel } from './financeImportUtils.js';

const ROLE_LABEL = {
  renda: 'Renda',
  despesas: 'Despesas',
  objetivos: 'Objetivos',
  ignorar: 'Ignorada',
};

function formatCell(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(2).replace('.', ',');
  }
  return String(value);
}

function SheetGrid({ sheet, highlight }) {
  const { grid } = sheet;
  const { anchors, covered } = buildMergeMaps(grid.merges);

  return (
    <div className="finance-sheet-scroll">
      <table className="finance-sheet-table">
        <thead>
          <tr>
            <th className="finance-sheet-corner" />
            {Array.from({ length: grid.colCount }, (_, i) => (
              <th key={i}>{colLabel(i + 1)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.cells.map((line, rowIndex) => {
            const rowNumber = rowIndex + 1;
            const isGoalRow = highlight.goalRows.has(rowNumber);
            return (
              <tr key={rowNumber} className={isGoalRow ? 'is-goal-row' : ''}>
                <th scope="row">{rowNumber}</th>
                {line.map((value, colIndex) => {
                  const colNumber = colIndex + 1;
                  const key = `${rowNumber}:${colNumber}`;
                  if (covered.has(key)) return null;

                  const span = anchors.get(key);
                  const classes = [];
                  if (highlight.imported.has(key)) classes.push('is-imported');
                  else if (highlight.skipped.has(key)) classes.push('is-skipped');
                  if (typeof value === 'number') classes.push('is-number');

                  return (
                    <td
                      key={colNumber}
                      className={classes.join(' ')}
                      colSpan={span?.colSpan}
                      rowSpan={span?.rowSpan}
                      title={`${colLabel(colNumber)}${rowNumber}`}
                    >
                      {formatCell(value)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const EMPTY_HIGHLIGHT = { imported: new Set(), skipped: new Set(), goalRows: new Set() };

export function FinanceSheetPreview({ sheets, roleOptions, onRoleChange, highlights, disabled }) {
  const [activeName, setActiveName] = useState(sheets[0]?.name ?? null);

  const active = sheets.find((sheet) => sheet.name === activeName) || sheets[0];
  if (!active) return null;

  const highlight = highlights.get(active.name) || EMPTY_HIGHLIGHT;

  return (
    <div className="finance-sheet-preview">
      <div className="finance-sheet-tabs">
        {sheets.map((sheet) => (
          <button
            key={sheet.name}
            type="button"
            className={`finance-sheet-tab${sheet.name === active.name ? ' is-active' : ''}${
              sheet.role === 'ignorar' ? ' is-ignored' : ''
            }`}
            onClick={() => setActiveName(sheet.name)}
          >
            {sheet.name}
            <span className="finance-sheet-tab-role">{ROLE_LABEL[sheet.role]}</span>
          </button>
        ))}
      </div>

      <div className="finance-sheet-toolbar">
        <label>
          Ler esta aba como
          <select
            value={active.role}
            onChange={(event) => onRoleChange(active.name, event.target.value)}
            disabled={disabled}
          >
            {roleOptions.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </label>
        <div className="finance-sheet-legend">
          <span className="finance-sheet-legend-item is-imported">importado</span>
          <span className="finance-sheet-legend-item is-skipped">não importado</span>
          <span className="finance-sheet-legend-item is-goal">objetivo</span>
        </div>
      </div>

      <SheetGrid sheet={active} highlight={highlight} />

      {active.grid.truncated && (
        <p className="finance-goal-form-hint">
          A aba é maior que isso — mostrando as primeiras {active.grid.rowCount} linhas e {active.grid.colCount}{' '}
          colunas.
        </p>
      )}
    </div>
  );
}
