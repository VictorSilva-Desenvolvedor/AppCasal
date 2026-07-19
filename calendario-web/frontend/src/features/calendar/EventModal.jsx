import { Modal } from '../../components/ui/index.js';
import { useCalendarData } from '../../hooks/useCalendarData.js';
import { EventListPanel } from './EventListPanel.jsx';
import { EventForm } from './EventForm.jsx';
import { toDateKey } from './calendarUtils.js';

function formatModalTitle(dateKey) {
  if (!dateKey) return 'Eventos do dia';
  const [y, m, d] = dateKey.split('-');
  return `Eventos em ${d}/${m}/${y}`;
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
    <Modal open={open} onClose={onClose} title={formatModalTitle(dateKey)}>
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
