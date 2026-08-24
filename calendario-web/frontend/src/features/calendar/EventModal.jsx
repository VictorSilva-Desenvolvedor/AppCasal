import { Modal } from '../../components/ui/index.js';
import { useCalendarData } from '../../hooks/useCalendarData.js';
import { EventListPanel } from './EventListPanel.jsx';
import { EventForm } from './EventForm.jsx';
import { toDateKey } from './calendarUtils.js';

function formatDate(dateKey) {
  const [y, m, d] = dateKey.split('-');
  return `${d}/${m}/${y}`;
}

function formatModalTitle(mode, dateKey, isEditing) {
  if (mode === 'form') {
    if (isEditing) return 'Editar evento';
    return dateKey ? `Novo evento em ${formatDate(dateKey)}` : 'Novo evento';
  }
  if (!dateKey) return 'Eventos do dia';
  return `Eventos em ${formatDate(dateKey)}`;
}

export function EventModal({
  open,
  mode,
  dateKey,
  editingEventId,
  onClose,
  onRequestNew,
  onRequestEdit,
  onSaved,
  onDeleted,
  onCancelForm,
}) {
  const { events } = useCalendarData();
  const editingEvent = editingEventId ? events.find((event) => event._id === editingEventId) : null;

  return (
    <Modal open={open} onClose={onClose} title={formatModalTitle(mode, dateKey, Boolean(editingEvent))}>
      {mode === 'list' ? (
        <EventListPanel dateKey={dateKey} onEdit={onRequestEdit} onNew={onRequestNew} />
      ) : (
        <EventForm
          key={editingEventId || `new-${dateKey}`}
          event={editingEvent}
          dateKey={editingEvent ? toDateKey(new Date(editingEvent.date)) : dateKey}
          onCancel={onCancelForm}
          onSaved={onSaved}
          onDeleted={onDeleted}
        />
      )}
    </Modal>
  );
}
