import { Icon } from '../../components/ui/index.js';
import { useCalendarData } from '../../hooks/useCalendarData.js';
import { personColorFor } from '../calendar/calendarUtils.js';

function formatLogTimestamp(date) {
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function UpdateCard({ item, dragging, dragProps, onDelete }) {
  const { users } = useCalendarData();
  const dotColor = item.creator ? personColorFor(users, item.creator._id) : 'var(--color-text-muted)';
  const authorName = item.creator?.name || 'desconhecido';

  return (
    <div className={`update-card${dragging ? ' dragging' : ''}`} data-status={item.status} {...dragProps}>
      <div className="update-card-title">{item.title}</div>
      {item.description && <div className="update-card-description">{item.description}</div>}
      <div className="update-card-footer">
        <span className="update-card-meta">
          <span className="person-dot" style={{ background: dotColor }} />
          {authorName} · {formatLogTimestamp(item.createdAt)}
        </span>
        <button
          type="button"
          className="update-card-delete"
          title="Excluir"
          aria-label="Excluir pedido"
          onClick={() => onDelete(item._id)}
        >
          <Icon name="trash" />
        </button>
      </div>
    </div>
  );
}
