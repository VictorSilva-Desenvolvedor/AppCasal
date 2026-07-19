import { useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import { useCalendarData } from '../../hooks/useCalendarData.js';
import { personColorFor } from '../calendar/calendarUtils.js';

const ACTION_LABELS = { created: 'criou', updated: 'editou', deleted: 'excluiu' };

function formatLogTimestamp(date) {
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ActivityPage() {
  const { users } = useCalendarData();
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getActivityLog()
      .then((data) => {
        if (!cancelled) setLogs(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="view">
      <h2>Atividades</h2>
      <p>Histórico de quem criou, editou ou excluiu eventos no calendário.</p>
      <div className="activity-feed">
        {error && <p className="sidebar-empty">Não foi possível carregar as atividades</p>}
        {!error && logs && logs.length === 0 && (
          <p className="sidebar-empty">Nenhuma atividade registrada ainda</p>
        )}
        {!error &&
          logs?.map((log) => {
            const dotColor = log.actor ? personColorFor(users, log.actor._id) : 'var(--color-text-muted)';
            const actorName = log.actor?.name || 'desconhecido';
            const actionLabel = ACTION_LABELS[log.action] || log.action;

            return (
              <div className={`activity-feed-item activity-feed-item--${log.action}`} key={log._id}>
                <div className="activity-feed-item-header">
                  <span>
                    <span className="person-dot" style={{ background: dotColor }} />
                    <strong>{actorName}</strong> {actionLabel} &quot;{log.eventTitle}&quot;
                  </span>
                  <span className="badge">{formatLogTimestamp(log.createdAt)}</span>
                </div>
                {log.details && <p className="activity-feed-item-details">{log.details}</p>}
              </div>
            );
          })}
      </div>
    </section>
  );
}
