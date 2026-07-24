import { Card, Pill } from '../../components/ui/index.js';
import { formatDuration } from './candyUtils.js';

const PERIODS = [
  { value: 'day', label: 'Dia' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
];

export function CandyRankingBoard({ period, onPeriodChange, ranking }) {
  const rows = ranking?.ranking || [];
  const maxTotal = rows.reduce((max, row) => Math.max(max, row.totalMs), 0);

  return (
    <Card className="candy-ranking-card">
      <div className="candy-period-tabs">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            type="button"
            className={`candy-tab-btn${period === p.value ? ' is-active' : ''}`}
            onClick={() => onPeriodChange(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="sidebar-empty">Sem registros neste período</p>
      ) : (
        <div className="candy-bars">
          {rows.map((row) => (
            <div className={`candy-bar-row${row.isWinner ? ' is-winner' : ''}`} key={row.user._id}>
              <span className="candy-bar-label">
                {row.user.name}
                {row.isWinner && <Pill className="candy-winner-pill">Vencendo</Pill>}
              </span>
              <div className="candy-bar-track">
                <div
                  className="candy-bar-fill"
                  style={{ width: `${maxTotal ? (row.totalMs / maxTotal) * 100 : 0}%` }}
                />
              </div>
              <span className="candy-bar-value">
                {formatDuration(row.totalMs)} · {row.count}x
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
