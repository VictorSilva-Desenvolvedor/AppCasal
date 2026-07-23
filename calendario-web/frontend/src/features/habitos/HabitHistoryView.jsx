import { buildHistoryDays, computeDayStatus } from './habitUtils.js';

const STATUS_LABEL = {
  complete: 'Completo',
  partial: 'Parcial',
  missed: 'Falhou',
  none: 'Sem dado',
};

export function HabitHistoryView({ habit, checkins, users }) {
  const days = buildHistoryDays(35);

  return (
    <div className="habit-history">
      <div className="habit-history-grid">
        {days.map((dayKey) => {
          const status = computeDayStatus(habit, dayKey, checkins, users);
          const dayCheckins = checkins.filter((c) => c.day === dayKey);
          const title = dayCheckins.length
            ? dayCheckins.map((c) => `${c.user?.name ?? ''}: ${c.emoji || ''} ${c.note || ''}`.trim()).join(' · ')
            : STATUS_LABEL[status];

          return (
            <span key={dayKey} className={`habit-history-cell habit-history-cell--${status}`} title={title}>
              {Number(dayKey.slice(-2))}
            </span>
          );
        })}
      </div>
      <div className="habit-history-legend">
        <span className="habit-history-legend-item">
          <span className="habit-history-cell habit-history-cell--complete" /> Completo
        </span>
        <span className="habit-history-legend-item">
          <span className="habit-history-cell habit-history-cell--partial" /> Parcial
        </span>
        <span className="habit-history-legend-item">
          <span className="habit-history-cell habit-history-cell--missed" /> Falhou
        </span>
      </div>
    </div>
  );
}
