import { useNavigate } from 'react-router-dom';
import { Icon } from '../../components/ui/index.js';
import { useCalendarData } from '../../hooks/useCalendarData.js';
import {
  filteredEvents,
  isEventRecurring,
  nextOccurrenceDate,
  personColorFor,
  sharedEventIdSet,
  specialCategoryIconSrc,
  toDateKey,
} from './calendarUtils.js';

const UPCOMING_LIMIT = 5;

export function UpcomingEventsList() {
  const { events, users, invitations, filters } = useCalendarData();
  const navigate = useNavigate();

  const todayKey = toDateKey(new Date());
  const sharedIds = sharedEventIdSet(invitations);

  const upcoming = filteredEvents(events, filters)
    .map((event) => ({ event, occurrence: nextOccurrenceDate(event) }))
    .filter(({ occurrence }) => toDateKey(occurrence) >= todayKey)
    .sort((a, b) => a.occurrence - b.occurrence)
    .slice(0, UPCOMING_LIMIT);

  if (upcoming.length === 0) {
    return <p className="sidebar-empty">Nenhum evento futuro</p>;
  }

  return (
    <div className="sidebar-list">
      {upcoming.map(({ event, occurrence }) => {
        const dateKey = toDateKey(occurrence);
        const [, m, d] = dateKey.split('-');
        const dotColor = event.creator ? personColorFor(users, event.creator._id) : 'var(--color-text-muted)';
        const specialIconSrc = specialCategoryIconSrc(event);

        return (
          <button
            key={event._id}
            type="button"
            className="sidebar-list-item is-clickable"
            onClick={() => navigate('/app/calendario', { state: { openDateKey: dateKey } })}
          >
            <span>
              <span className="person-dot" style={{ background: dotColor }} />
              {specialIconSrc && <img className="special-category-icon icon-inline" src={specialIconSrc} alt="" />}
              {sharedIds.has(event._id) && <Icon name="heart" className="icon-inline shared-badge-icon" />}
              {isEventRecurring(event) && <Icon name="repeat" className="icon-inline" />}
              {event.title}
            </span>
            <span>
              {d}/{m}
            </span>
          </button>
        );
      })}
    </div>
  );
}
