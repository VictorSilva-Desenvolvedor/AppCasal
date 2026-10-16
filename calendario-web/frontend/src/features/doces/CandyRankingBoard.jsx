import { Icon, Pill } from '../../components/ui/index.js';
import { candyWeightColor, formatCandyCount, intensityForDuration, scaleForElapsed } from './candyUtils.js';

const PERIODS = [
  { value: 'day', label: 'Dia' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
];

function groupEntriesByUser(entries) {
  const map = new Map();
  entries.forEach((entry) => {
    const userId = entry.user?._id;
    if (!userId) return;
    if (!map.has(userId)) map.set(userId, []);
    map.get(userId).push(entry);
  });
  return map;
}

export function CandyRankingBoard({ period, onPeriodChange, ranking, entries }) {
  const rows = ranking?.ranking || [];
  const entriesByUser = groupEntriesByUser(entries || []);

  return (
    <div className="candy-ranking">
      <div className="candy-period-tabs" role="group" aria-label="Período">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            type="button"
            className={`candy-period-btn${period === p.value ? ' is-active' : ''}`}
            aria-pressed={period === p.value}
            onClick={() => onPeriodChange(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="candy-empty">Nenhum doce neste período. Bom sinal!</p>
      ) : (
        <div className="candy-bars">
          {rows.map((row) => {
            const rowEntries = entriesByUser.get(row.user._id) || [];
            return (
              <div className={`candy-bar-row${row.isWinner ? ' is-winner' : ''}`} key={row.user._id}>
                <span className="candy-bar-marker" aria-hidden="true">
                  {row.isWinner ? (
                    <Icon name="trophy" className="candy-bar-trophy" />
                  ) : row.count > 0 ? (
                    <span className="candy-bar-dot" />
                  ) : null}
                </span>
                <div className="candy-bar-body">
                  <span className="candy-bar-label">
                    {row.user.name}
                    {row.isWinner && <Pill className="candy-winner-pill">Vencendo</Pill>}
                  </span>
                  {rowEntries.length > 0 && (
                    // Cada doce é um ponto-cruz: maior e mais quente quanto mais tempo durou.
                    <div className="candy-rank-candies" aria-hidden="true">
                      {rowEntries.map((entry, i) => (
                        <span
                          key={entry._id}
                          className="candy-x stitch-anim"
                          title={`${Math.round(entry.durationMs / 1000)}s`}
                          style={{
                            '--x-size': `${12 + intensityForDuration(entry.durationMs) * 2}px`,
                            '--x-color': candyWeightColor(scaleForElapsed(entry.durationMs)),
                            '--stitch-delay': `${Math.min(i, 12) * 40}ms`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <span className="candy-bar-value">{formatCandyCount(row.count)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
