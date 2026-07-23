import { useEffect, useRef, useState } from 'react';
import { Field, Button } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useToast } from '../../hooks/useToast.js';
import { TYPE_META, DIRECTOR_LABEL, RATING_SCALE, RATING_SOURCE } from './watchlistUtils.js';

const SEARCH_DEBOUNCE_MS = 450;

export function WatchlistForm({ onSaved, onCancel }) {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [type, setType] = useState('filme');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const [posterResults, setPosterResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [posterUrl, setPosterUrl] = useState('');
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const searchRequestId = useRef(0);

  function handleTypeChange(nextType) {
    setType(nextType);
    setPosterResults([]);
    setSelectedResult(null);
    setPosterUrl('');
    setDetails(null);
  }

  function handleClearSelection() {
    setSelectedResult(null);
    setDetails(null);
    setPosterUrl('');
  }

  async function handleSelect(result) {
    setSelectedResult(result);
    setPosterUrl(result.posterUrl);
    setTitle(result.title);
    setPosterResults([]);
    setDetails(null);

    setDetailsLoading(true);
    try {
      const data = await api.getWatchlistPosterDetails(type, result.id);
      setDetails(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDetailsLoading(false);
    }
  }

  // Busca automática (autocomplete) conforme o título é digitado. Enquanto o
  // título digitado bater com o resultado escolhido, não busca de novo — só
  // volta a buscar se o usuário editar o título ou trocar a seleção (Trocar).
  useEffect(() => {
    const trimmed = title.trim();

    if (selectedResult && trimmed !== selectedResult.title) {
      setSelectedResult(null);
      setDetails(null);
      setPosterUrl('');
    }

    if (selectedResult && trimmed === selectedResult.title) {
      setPosterResults([]);
      return undefined;
    }

    if (trimmed.length < 2) {
      setPosterResults([]);
      return undefined;
    }

    const requestId = ++searchRequestId.current;
    setSearching(true);

    const timer = setTimeout(async () => {
      try {
        const results = await api.searchWatchlistPoster(type, trimmed);
        if (requestId === searchRequestId.current) setPosterResults(results);
      } catch {
        // busca automática é conveniência, não deve incomodar o usuário com toast
      } finally {
        if (requestId === searchRequestId.current) setSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, type, selectedResult]);

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      showToast('Dê um título ao item', 'error');
      return;
    }

    setSaving(true);
    try {
      const item = await api.createWatchlistItem({
        title: trimmedTitle,
        type,
        note: note.trim(),
        posterUrl,
        genres: details?.genres || [],
        director: details?.director || '',
        duration: details?.duration || '',
        rating: details?.rating ?? null,
        synopsis: details?.synopsis || '',
      });
      showToast('Adicionado à watchlist!', 'success');
      onSaved(item);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="watchlist-form" onSubmit={handleSubmit}>
      <Field label="Título" htmlFor="watchlist-title">
        <input
          id="watchlist-title"
          type="text"
          maxLength={140}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Ex: Anatomia de Uma Queda"
          autoFocus
          autoComplete="off"
        />
        {searching && !selectedResult && <p className="watchlist-search-hint">Buscando…</p>}
        {posterResults.length > 0 && !selectedResult && (
          <div className="watchlist-poster-results">
            {posterResults.map((result) => (
              <button
                key={result.id}
                type="button"
                className="watchlist-poster-option"
                onClick={() => handleSelect(result)}
                disabled={!result.posterUrl}
                title={`${result.title}${result.subtitle ? ` (${result.subtitle})` : ''}`}
              >
                {result.posterUrl ? (
                  <img src={result.posterUrl} alt={result.title} />
                ) : (
                  <span className="watchlist-poster-option-empty">{result.title}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </Field>

      <Field label="Tipo">
        <div className="watchlist-type-toggle">
          {Object.entries(TYPE_META).map(([key, meta]) => (
            <button
              key={key}
              type="button"
              className={`watchlist-type-toggle-btn${type === key ? ' is-active' : ''}`}
              style={{ '--watch-type-color': `var(${meta.colorVar})` }}
              onClick={() => handleTypeChange(key)}
            >
              <span aria-hidden="true">{meta.emoji}</span> {meta.label}
            </button>
          ))}
        </div>
      </Field>

      {selectedResult && (
        <div className="watchlist-detail-preview">
          <div className="watchlist-detail-preview-header">
            {posterUrl && (
              <img src={posterUrl} alt={selectedResult.title} className="watchlist-detail-preview-poster" />
            )}
            <div className="watchlist-detail-preview-info">
              <strong>{selectedResult.title}</strong>
              {details?.director && (
                <span className="watchlist-detail-preview-director">
                  {DIRECTOR_LABEL[type]}: {details.director}
                </span>
              )}
              {details?.genres?.length > 0 && (
                <div className="watchlist-detail-preview-genres">
                  {details.genres.slice(0, 4).map((genre) => (
                    <span key={genre} className="watchlist-genre-chip">
                      {genre}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {detailsLoading && <p className="watchlist-search-hint">Carregando detalhes…</p>}
          {details?.synopsis && <p className="watchlist-detail-preview-synopsis">{details.synopsis}</p>}

          {(details?.rating != null || details?.duration || selectedResult.subtitle) && (
            <div className="watchlist-detail-preview-stats">
              {details?.rating != null && (
                <span>
                  {RATING_SOURCE[type]} {details.rating}/{RATING_SCALE[type]}
                </span>
              )}
              {selectedResult.subtitle && <span>{selectedResult.subtitle}</span>}
              {details?.duration && <span>{details.duration}</span>}
            </div>
          )}

          <button type="button" className="watchlist-poster-clear" onClick={handleClearSelection}>
            Trocar escolha
          </button>
        </div>
      )}

      <Field label="Nota (opcional)" htmlFor="watchlist-note">
        <textarea
          id="watchlist-note"
          maxLength={280}
          rows={3}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder='Ex: "bom pra assistir chorando", "recomendado pelo Fulano"'
        />
      </Field>

      <div className="watchlist-form-actions">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={saving}>
          Adicionar
        </Button>
      </div>
    </form>
  );
}
