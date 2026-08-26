import { useState } from 'react';
import { Card, ConfirmDialog, IconButton, Icon, Pill } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/useToast.js';
import { usePendingIds } from '../../hooks/usePendingIds.js';
import {
  candyWeightColor,
  candyWeightTier,
  formatDayLabel,
  formatDuration,
  formatEntryTime,
  groupEntriesByDay,
  intensityForDuration,
  scaleForElapsed,
} from './candyUtils.js';

export function CandyHistoryList({ entries, onDeleted }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { isPending, run } = usePendingIds();
  const [deleteTarget, setDeleteTarget] = useState(null);

  async function handleConfirmDelete() {
    const id = deleteTarget._id;
    setDeleteTarget(null);
    try {
      await run(id, () => api.deleteCandyEntry(id));
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
              const intensity = intensityForDuration(entry.durationMs);
              const tier = candyWeightTier(entry.durationMs);
              return (
                <Card className="candy-history-item" key={entry._id}>
                  <span
                    className="candy-history-dot"
                    aria-hidden="true"
                    style={{
                      width: 10 + intensity * 2,
                      height: 10 + intensity * 2,
                      background: candyWeightColor(scaleForElapsed(entry.durationMs)),
                    }}
                  />
                  <div className="candy-history-item-info">
                    <strong>{entry.user?.name || '—'}</strong>
                    <span className="candy-history-item-meta">{formatEntryTime(entry.createdAt)}</span>
                  </div>
                  <Pill className="candy-history-chip" style={{ background: tier.bg, color: tier.text }}>
                    {formatDuration(entry.durationMs)}
                  </Pill>
                  {isOwner && (
                    <IconButton
                      onClick={() => setDeleteTarget(entry)}
                      title="Excluir"
                      loading={isPending(entry._id)}
                    >
                      <Icon name="trash" />
                    </IconButton>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Excluir registro"
        message={
          deleteTarget
            ? `O registro das ${formatEntryTime(deleteTarget.createdAt)} (${formatDuration(deleteTarget.durationMs)}) será removido do histórico.`
            : ''
        }
        confirmLabel="Excluir"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
