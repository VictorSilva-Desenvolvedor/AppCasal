import { useMemo } from 'react';
import { useCalendarData } from '../../hooks/useCalendarData.js';
import { EventListItem } from './EventListItem.jsx';
import { buildOccurrenceMap, filteredEvents } from './calendarUtils.js';

const AGENDA_DAYS_AHEAD = 60;

export function AgendaView({ filters, onEdit }) {
  const { events } = useCalendarData();

  const { sortedKeys, occMap } = useMemo(() => {
    const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 12, 0, 0);
    const horizon = new Date(today.getFullYear(), today.getMonth(), today.getDate() + AGENDA_DAYS_AHEAD, 12, 0, 0);
    const map = buildOccurrenceMap(filteredEvents(events, filters), today, horizon);
    return { sortedKeys: [...map.keys()].sort(), occMap: map };
  }, [events, filters]);

  if (sortedKeys.length === 0) {
    return <p className="sidebar-empty">Nenhum evento nos próximos dias.</p>;
  }

  return (
    <div className="calendar-agenda-list fade-in">
      {sortedKeys.map((key) => {
        const [y, m, d] = key.split('-').map(Number);
        const rawLabel = new Date(y, m - 1, d).toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
        });
        const label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
        const dayEvents = occMap.get(key).slice().sort((a, b) => new Date(a.date) - new Date(b.date));

        return (
          <div className="agenda-day-group" key={key}>
            <h3 className="agenda-day-heading">{label}</h3>
            {dayEvents.map((event) => (
              <EventListItem key={event._id} event={event} onEdit={onEdit} />
            ))}
          </div>
        );
      })}
    </div>
  );
}
