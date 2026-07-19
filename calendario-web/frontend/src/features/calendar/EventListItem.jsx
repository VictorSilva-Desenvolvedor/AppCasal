import { Button, Icon } from '../../components/ui/index.js';
import { useCalendarData } from '../../hooks/useCalendarData.js';
import { CATEGORIES } from '../../constants/categories.js';
import {
  IMAGE_MIME,
  attachmentIconName,
  fileUrl,
  isEventRecurring,
  personColorFor,
  sharedEventIdSet,
  specialCategoryIconSrc,
} from './calendarUtils.js';

// Item de evento reutilizado pela lista do modal do dia, pela visão de dia e
// pela agenda — mesma marcação que eventListItemHtml() gerava no legado.
export function EventListItem({ event, onEdit }) {
  const { users, invitations } = useCalendarData();
  const sharedIds = sharedEventIdSet(invitations);
  const dotColor = event.creator ? personColorFor(users, event.creator._id) : 'var(--color-text-muted)';
  const category = event.category && CATEGORIES[event.category];
  const specialIconSrc = specialCategoryIconSrc(event);

  return (
    <div className="event-list-item-wrap">
      <div className="event-list-item">
        <div>
          <strong>
            {specialIconSrc && <img className="special-category-icon icon-inline" src={specialIconSrc} alt="" />}
            {sharedIds.has(event._id) && <Icon name="heart" className="icon-inline shared-badge-icon" />}
            {isEventRecurring(event) && <Icon name="repeat" className="icon-inline" />}
            {event.title}
          </strong>
          {category && (
            <span className="category-chip" style={{ background: category.color }}>
              {category.label}
            </span>
          )}
          <br />
          <span className="badge">
            <span className="person-dot" style={{ background: dotColor }} />
            por {event.creator?.name || 'desconhecido'}
          </span>
        </div>
        <Button variant="secondary" onClick={() => onEdit(event)}>
          Editar
        </Button>
      </div>
      {event.attachments && event.attachments.length > 0 && (
        <div className="attachments-preview">
          {event.attachments.map((att) => (
            <a key={att.url} className="attachment-item" href={fileUrl(att.url)} target="_blank" rel="noopener">
              {IMAGE_MIME.test(att.mimetype) ? (
                <img className="attachment-thumb" src={fileUrl(att.url)} alt={att.name} />
              ) : (
                <span className="attachment-file">
                  <Icon name={attachmentIconName(att.mimetype)} />
                </span>
              )}
              <span className="attachment-name">{att.name}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
