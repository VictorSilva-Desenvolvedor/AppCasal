import { TYPE_META } from './watchlistUtils.js';

export function WatchlistFilters({ typeFilter, onTypeFilterChange, onlyPending, onOnlyPendingChange }) {
  return (
    <div className="watchlist-filters">
      <div className="watchlist-type-toggle" role="group" aria-label="Filtrar por tipo">
        <button
          type="button"
          className={`watchlist-type-toggle-btn${typeFilter === '' ? ' is-active' : ''}`}
          aria-pressed={typeFilter === ''}
          onClick={() => onTypeFilterChange('')}
        >
          Todos
        </button>
        {Object.entries(TYPE_META).map(([key, meta]) => (
          <button
            key={key}
            type="button"
            className={`watchlist-type-toggle-btn${typeFilter === key ? ' is-active' : ''}`}
            data-type={key}
            aria-pressed={typeFilter === key}
            style={{ '--watch-type-color': `var(${meta.colorVar})` }}
            onClick={() => onTypeFilterChange(key)}
          >
            <span aria-hidden="true">{meta.emoji}</span> {meta.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        className={`watchlist-type-toggle-btn watchlist-pending-toggle${onlyPending ? ' is-active' : ''}`}
        aria-pressed={onlyPending}
        onClick={() => onOnlyPendingChange(!onlyPending)}
      >
        Só o que falta ver/jogar
      </button>
    </div>
  );
}
