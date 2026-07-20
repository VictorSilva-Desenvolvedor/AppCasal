import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../ui/index.js';
import { useCalendarData } from '../../hooks/useCalendarData.js';
import { NotificationBell } from './NotificationBell.jsx';
import { GlobalSearchResults } from '../../features/calendar/GlobalSearchResults.jsx';
import { matchesSearchTerm, toDateKey } from '../../features/calendar/calendarUtils.js';
import { CATEGORIES } from '../../constants/categories.js';

const GLOBAL_SEARCH_RESULT_LIMIT = 20;

export function Topbar({ onToggleSidebar, showFilterBar }) {
  const { events, users, filters, setFilters } = useCalendarData();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [dismissed, setDismissed] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    function handleDocumentClick(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setDismissed(true);
      }
    }
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  const trimmedQuery = query.trim();
  const resultsVisible = Boolean(trimmedQuery) && !dismissed;
  const results = resultsVisible
    ? events
        .filter((event) => matchesSearchTerm(event, trimmedQuery))
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, GLOBAL_SEARCH_RESULT_LIMIT)
    : [];

  function handleSelectResult(event) {
    const dateKey = toDateKey(new Date(event.date));
    setQuery('');
    setDismissed(true);
    navigate('/app/calendario', { state: { openDateKey: dateKey } });
  }

  function updateFilter(patch) {
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  return (
    <div className="toolbar">
      <button
        type="button"
        className="sidebar-toggle"
        title="Voltar para o lobby"
        aria-label="Voltar para o lobby"
        onClick={() => navigate('/app')}
      >
        <Icon name="chevron-left" />
      </button>

      <button
        type="button"
        className="sidebar-toggle"
        title="Mostrar/ocultar barra lateral"
        aria-label="Mostrar/ocultar barra lateral"
        onClick={onToggleSidebar}
      >
        <Icon name="menu" />
      </button>

      <div className="global-search" ref={searchRef}>
        <input
          type="text"
          placeholder="Buscar em todos os eventos (qualquer data)..."
          autoComplete="off"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setDismissed(false);
          }}
        />
        {resultsVisible && <GlobalSearchResults results={results} onSelect={handleSelectResult} />}
      </div>

      <NotificationBell />

      {showFilterBar && (
        <div className="filter-bar card">
          <input
            type="text"
            placeholder="Buscar por título ou descrição..."
            value={filters.search}
            onChange={(event) => updateFilter({ search: event.target.value })}
          />
          <select value={filters.creatorId} onChange={(event) => updateFilter({ creatorId: event.target.value })}>
            <option value="">Todos os usuários</option>
            {users.map((user) => (
              <option key={user._id} value={user._id}>
                {user.name}
              </option>
            ))}
          </select>
          <select value={filters.category} onChange={(event) => updateFilter({ category: event.target.value })}>
            <option value="">Todas as categorias</option>
            {Object.entries(CATEGORIES).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </select>
          <label className="filter-chip flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm text-text-muted cursor-pointer transition-colors hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-white">
            <input
              type="checkbox"
              className="sr-only"
              checked={filters.onlyWithAttachment}
              onChange={(event) => updateFilter({ onlyWithAttachment: event.target.checked })}
            />
            <Icon name={filters.onlyWithAttachment ? 'check-circle' : 'paperclip'} className="h-4 w-4" />
            Só com anexo
          </label>
        </div>
      )}
    </div>
  );
}
