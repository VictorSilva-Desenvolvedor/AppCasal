import { Button, Icon } from '../../components/ui/index.js';
import { useCalendarData } from '../../hooks/useCalendarData.js';
import { EventListItem } from './EventListItem.jsx';
import { eventsByDateKey, toDateKey } from './calendarUtils.js';

export function DayView({ viewDate, filters, onEdit, onNew }) {
  const { events } = useCalendarData();
  const dateKey = toDateKey(viewDate);
  const dayEvents = eventsByDateKey(events, filters, dateKey);

  return (
    <div className="calendar-day-list fade-in" key={dateKey}>
      {dayEvents.length === 0 ? (
        <p className="sidebar-empty">Nenhum evento neste dia.</p>
      ) : (
        dayEvents.map((event) => <EventListItem key={event._id} event={event} onEdit={onEdit} />)
      )}
      <Button block onClick={() => onNew(dateKey)} style={{ marginTop: '1rem' }}>
        <Icon name="plus" />
        Novo evento
      </Button>
    </div>
  );
}
