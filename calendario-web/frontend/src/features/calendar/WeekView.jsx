import { useMemo } from 'react';
import { Icon } from '../../components/ui/index.js';
import { useCalendarData } from '../../hooks/useCalendarData.js';
import { useDragAndDrop } from '../../hooks/useDragAndDrop.js';
import { useToast } from '../../hooks/useToast.js';
import { api } from '../../services/api.js';
import {
  WEEKDAYS,
  buildOccurrenceMap,
  dateKeyToNoonISO,
  dayIconBadgeSrcs,
  filteredEvents,
  hasImportantDate,
  isEventRecurring,
  pillColorFor,
  sharedEventIdSet,
  toDateKey,
} from './calendarUtils.js';

function startOfWeek(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay(), 12, 0, 0);
}

export function WeekView({ viewDate, filters, onSelectDay }) {
  const { events, users, invitations, refetchEvents } = useCalendarData();
  const { showToast } = useToast();

  const weekStart = useMemo(() => startOfWeek(viewDate), [viewDate]);
  const days = useMemo(
    () =>
      Array.from(
        { length: 7 },
        (_, i) => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i, 12, 0, 0),
      ),
    [weekStart],
  );
  const visibleEvents = useMemo(() => filteredEvents(events, filters), [events, filters]);
  const occMap = useMemo(() => buildOccurrenceMap(visibleEvents, days[0], days[6]), [visibleEvents, days]);
  const sharedIds = sharedEventIdSet(invitations);
  const todayKey = toDateKey(new Date());

  async function rescheduleEvent(eventId, dateKey) {
    const event = events.find((item) => item._id === eventId);
    if (!event || toDateKey(new Date(event.date)) === dateKey) return;

    try {
      await api.updateEvent(eventId, {
        title: event.title,
        description: event.description || '',
        date: dateKeyToNoonISO(dateKey),
        attachments: event.attachments || [],
        recurrenceRule: event.recurrenceRule,
        category: event.category || null,
        hideWhenPast: Boolean(event.hideWhenPast),
      });
      await refetchEvents();
      showToast('Evento reagendado', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  const dnd = useDragAndDrop({
    canDrag: (item) => !isEventRecurring(item.event),
    onDrop: (eventId, dateKey) => rescheduleEvent(eventId, dateKey),
  });

  return (
    <div className="calendar-week-grid fade-in" key={toDateKey(weekStart)}>
      {days.map((date) => {
        const dateKey = toDateKey(date);
        const dayEvents = (occMap.get(dateKey) || []).slice().sort((a, b) => new Date(a.date) - new Date(b.date));
        const isToday = dateKey === todayKey;
        const badgeSrcs = dayIconBadgeSrcs(dayEvents);

        const cellClassName = [
          'calendar-day',
          'calendar-week-day',
          isToday && 'is-today',
          hasImportantDate(dayEvents) && 'is-important-date',
          dnd.isDropTarget(dateKey) && 'is-drop-target',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <button
            type="button"
            key={dateKey}
            className={cellClassName}
            onClick={() => onSelectDay(dateKey)}
            {...dnd.dropProps(dateKey)}
          >
            {badgeSrcs.length > 0 && (
              <span className="calendar-day-special-badge">
                {badgeSrcs.map((src) => (
                  <img className="special-category-icon" src={src} alt="" key={src} />
                ))}
              </span>
            )}
            <div className="calendar-day-header">
              <span className="calendar-day-weekday">{WEEKDAYS[date.getDay()]}</span>
              <span className="calendar-day-number">{date.getDate()}</span>
            </div>
            <div className="calendar-day-events">
              {dayEvents.map((event) => (
                <span
                  key={event._id}
                  className={`event-pill${dnd.isDragging(event._id) ? ' is-dragging' : ''}`}
                  style={{ background: pillColorFor(event, users) }}
                  {...dnd.dragProps({ id: event._id, event })}
                >
                  {sharedIds.has(event._id) && <Icon name="heart" className="icon-inline shared-badge-icon" />}
                  {isEventRecurring(event) && <Icon name="repeat" className="icon-inline" />}
                  {event.title}
                </span>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}
