import { Button, Icon } from '../../components/ui/index.js';
import { useCalendarData } from '../../hooks/useCalendarData.js';
import { EventListItem } from './EventListItem.jsx';
import { eventsByDateKey } from './calendarUtils.js';

export function EventListPanel({ dateKey, onEdit, onNew }) {
  const { events, filters } = useCalendarData();
  const dayEvents = eventsByDateKey(events, filters, dateKey);

  return (
    <div>
      {dayEvents.length === 0 ? (
        <p>Nenhum evento neste dia ainda.</p>
      ) : (
        dayEvents.map((event) => <EventListItem key={event._id} event={event} onEdit={onEdit} />)
      )}
      <Button block onClick={onNew} style={{ marginTop: '1rem' }}>
        <Icon name="plus" />
        Novo evento
      </Button>
    </div>
  );
}
