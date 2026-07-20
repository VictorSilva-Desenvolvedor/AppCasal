import { useMemo } from 'react';
import { Icon } from '../../components/ui/index.js';
import { useCalendarData } from '../../hooks/useCalendarData.js';
import { useDragAndDrop } from '../../hooks/useDragAndDrop.js';
import { useToast } from '../../hooks/useToast.js';
import { api } from '../../services/api.js';
import {
  IMAGE_MIME,
  WEEKDAYS,
  buildMonthCells,
  buildOccurrenceMap,
  dateKeyToNoonISO,
  dayIconBadgeSrcs,
  fileUrl,
  filteredEvents,
  hasImportantDate,
  isEventRecurring,
  pillColorFor,
  sharedEventIdSet,
  toDateKey,
} from './calendarUtils.js';

export function MonthView({ viewDate, filters, onSelectDay }) {
  const { events, users, invitations, refetchEvents } = useCalendarData();
  const { showToast } = useToast();

  const cells = useMemo(() => buildMonthCells(viewDate), [viewDate]);
  const monthDates = cells.filter(Boolean);
  const visibleEvents = useMemo(() => filteredEvents(events, filters), [events, filters]);
  const occMap = useMemo(
    () =>
      monthDates.length
        ? buildOccurrenceMap(visibleEvents, monthDates[0], monthDates[monthDates.length - 1])
        : new Map(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibleEvents, viewDate],
  );
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

  const monthKey = `${viewDate.getFullYear()}-${viewDate.getMonth()}`;

  return (
    <div className="calendar-month-grid-wrap">
      <div className="calendar-grid">
        {WEEKDAYS.map((weekday) => (
          <div className="calendar-weekday" key={weekday}>
            {weekday}
          </div>
        ))}
      </div>
      <div className="calendar-grid fade-in" style={{ marginTop: 6 }} key={monthKey}>
        {cells.map((date, index) => {
          if (!date) return <div className="calendar-day is-empty" key={`empty-${index}`} />;

          const dateKey = toDateKey(date);
          const dayEvents = (occMap.get(dateKey) || []).slice().sort((a, b) => new Date(a.date) - new Date(b.date));
          const isToday = dateKey === todayKey;
          const badgeSrcs = dayIconBadgeSrcs(dayEvents);

          const dayAttachments = dayEvents.flatMap((event) => event.attachments || []);
          const dayImages = dayAttachments.filter((att) => IMAGE_MIME.test(att.mimetype));
          const hasOtherAttachment = dayAttachments.some((att) => !IMAGE_MIME.test(att.mimetype));

          const cellClassName = [
            'calendar-day',
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
                <span className="calendar-day-number">{date.getDate()}</span>
                {hasOtherAttachment && (
                  <span className="calendar-day-attachment-badge">
                    <Icon name="paperclip" />
                  </span>
                )}
              </div>
              <div className="calendar-day-events">
                {dayEvents.slice(0, 3).map((event) => (
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
                {dayEvents.length > 3 && <span className="badge">+{dayEvents.length - 3} mais</span>}
              </div>
              {dayImages.length > 0 && (
                <div className="calendar-day-thumbs">
                  {dayImages.slice(0, 3).map((att) => (
                    <img key={att.url} className="calendar-day-thumb" src={fileUrl(att.url)} alt={att.name} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
