import { CATEGORIES } from '../../constants/categories.js';

export function GlobalSearchResults({ results, onSelect }) {
  if (results.length === 0) {
    return (
      <div className="global-search-results">
        <p className="global-search-empty">Nenhum evento encontrado</p>
      </div>
    );
  }

  return (
    <div className="global-search-results">
      {results.map((event) => {
        const dateLabel = new Date(event.date).toLocaleDateString('pt-BR');
        const category = event.category && CATEGORIES[event.category];

        return (
          <button key={event._id} type="button" className="global-search-result" onClick={() => onSelect(event)}>
            <span>
              {event.title}
              {category && (
                <span className="category-chip" style={{ background: category.color }}>
                  {category.label}
                </span>
              )}
            </span>
            <span className="global-search-result-date">{dateLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
