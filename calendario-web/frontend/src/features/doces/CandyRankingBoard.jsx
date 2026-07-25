import { Card, Icon, Pill } from '../../components/ui/index.js';
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
          {rows.map((row) => {
            const rowEntries = entriesByUser.get(row.user._id) || [];
            return (
              <div className={`candy-bar-row${row.isWinner ? ' is-winner' : ''}`} key={row.user._id}>
                <span className="candy-bar-marker" aria-hidden="true">
                  {row.isWinner ? (
                    <Icon name="trophy" className="candy-bar-trophy" />
                  ) : (
                    <span className="candy-bar-dot" />
                  )}
                </span>
                <div className="candy-bar-body">
                  <span className="candy-bar-label">
                    {row.user.name}
                    {row.isWinner && <Pill className="candy-winner-pill">Vencendo</Pill>}
                  </span>
                  {rowEntries.length > 0 && (
                    <div className="candy-rank-candies">
                      {rowEntries.map((entry) => {
                        const intensity = intensityForDuration(entry.durationMs);
                        return (
                          <span
                            key={entry._id}
                            className="candy-rank-candy"
                            title={`${Math.round(entry.durationMs / 1000)}s`}
                            style={{
                              width: 10 + intensity * 2,
                              height: 10 + intensity * 2,
                              background: candyWeightColor(scaleForElapsed(entry.durationMs)),
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
                <span className="candy-bar-value">{formatCandyCount(row.count)}</span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
