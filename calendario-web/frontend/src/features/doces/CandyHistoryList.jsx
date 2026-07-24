import { Card, IconButton, Icon } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/useToast.js';
import { candyWeightColor, formatDayLabel, formatDuration, formatEntryTime, groupEntriesByDay, scaleForElapsed } from './candyUtils.js';

export function CandyHistoryList({ entries, onDeleted }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  async function handleDelete(id) {
    if (!window.confirm('Excluir este registro?')) return;
    try {
      await api.deleteCandyEntry(id);
      await onDeleted();
      showToast('Registro excluído', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  if (entries.length === 0) {
    return <p className="sidebar-empty">Nenhum registro ainda</p>;
  }

  const days = groupEntriesByDay(entries);

  return (
    <div className="candy-history-days">
      {days.map(({ day, entries: dayEntries }) => (
        <div className="candy-history-day-group" key={day}>
          <strong className="candy-history-day-header">{formatDayLabel(day)}</strong>
          <div className="candy-history-list">
            {dayEntries.map((entry) => {
              const isOwner = entry.user?._id === user?._id;
              return (
                <Card className="candy-history-item" key={entry._id}>
                  <span
                    className="candy-history-dot"
                    aria-hidden="true"
                    style={{ background: candyWeightColor(scaleForElapsed(entry.durationMs)) }}
                  />
                  <div className="candy-history-item-info">
                    <strong>{entry.user?.name || '—'}</strong>
                    <span className="candy-history-item-meta">
                      {formatDuration(entry.durationMs)} · {formatEntryTime(entry.createdAt)}
                    </span>
                  </div>
                  {isOwner && (
                    <IconButton onClick={() => handleDelete(entry._id)} title="Excluir">
                      <Icon name="trash" />
                    </IconButton>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
