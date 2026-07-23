import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../components/ui/index.js';
import { personColorFor } from '../calendar/calendarUtils.js';
import { TYPE_META, ratingByUser, isFullyRated, initialOf } from './watchlistUtils.js';

function HeartsDisplay({ hearts }) {
  return (
    <span className="watchlist-hearts" aria-label={`${hearts} de 5 corações`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon key={n} name="heart" className={n <= hearts ? 'is-filled' : ''} />
      ))}
    </span>
  );
}

export function WatchlistCard({
  item,
  ratings,
  users,
  currentUserId,
  dragging,
  justDropped,
  dragProps,
  onDelete,
  onRate,
}) {
  const meta = TYPE_META[item.type];
  const authorName = item.creator?.name || 'desconhecido';
  const authorColor = item.creator ? personColorFor(users, item.creator._id) : 'var(--watch-vinho)';
  const canRate = item.status === 'visto_ouvido';
  const fullyRated = canRate && isFullyRated(ratings, users);

  const wasFullyRatedRef = useRef(fullyRated);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    const wasFullyRated = wasFullyRatedRef.current;
    wasFullyRatedRef.current = fullyRated;
    if (fullyRated && !wasFullyRated) {
      setCelebrate(true);
      const timer = setTimeout(() => setCelebrate(false), 1400);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [fullyRated]);

  const classes = [
    'card',
    'watchlist-card',
    dragging && 'dragging',
    justDropped && 'just-dropped',
    fullyRated && 'is-fully-rated',
    celebrate && 'watchlist-celebrate',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} data-type={item.type} style={{ '--watch-type-color': `var(${meta.colorVar})` }} {...dragProps}>
      <span className="watchlist-card-badge" aria-hidden="true">
        {meta.emoji}
      </span>

      <button
        type="button"
        className="icon-btn watchlist-card-delete"
        aria-label="Remover item"
        onClick={() => onDelete(item._id)}
      >
        <Icon name="trash" />
      </button>

      <h4 className="watchlist-card-title">{item.title}</h4>
      {item.note && <p className="watchlist-card-note">"{item.note}"</p>}

      <div className="watchlist-card-footer">
        <span className="watchlist-card-author">
          <span className="watchlist-avatar" style={{ '--author-color': authorColor }}>
            {initialOf(authorName)}
          </span>
          sugerido por {authorName}
        </span>
      </div>

      {canRate && (
        <div className="watchlist-card-ratings">
          {users.map((u) => {
            const rating = ratingByUser(ratings, u._id);
            const isMe = u._id === currentUserId;
            return (
              <div key={u._id} className="watchlist-rating-row">
                <span className="watchlist-avatar" style={{ '--author-color': personColorFor(users, u._id) }}>
                  {initialOf(u.name)}
                </span>
                <span className="watchlist-rating-name">{isMe ? 'Você' : u.name}</span>
                {rating ? (
                  <>
                    <HeartsDisplay hearts={rating.hearts} />
                    {rating.comment && <span className="watchlist-rating-comment">"{rating.comment}"</span>}
                  </>
                ) : (
                  <span className="watchlist-rating-pending">ainda não avaliou</span>
                )}
              </div>
            );
          })}
          <button type="button" className="btn btn-secondary watchlist-rate-btn" onClick={() => onRate(item)}>
            {ratingByUser(ratings, currentUserId) ? 'Editar minha nota' : 'Avaliar'}
          </button>
        </div>
      )}

      {celebrate && (
        <div className="watchlist-confetti" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="watchlist-confetti-heart" style={{ '--i': i }}>
              ♥
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
