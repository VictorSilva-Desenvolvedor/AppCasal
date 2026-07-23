import { useState } from 'react';
import { Field, Button } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useToast } from '../../hooks/useToast.js';
import { TYPE_META } from './watchlistUtils.js';

export function WatchlistForm({ onSaved, onCancel }) {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [type, setType] = useState('filme');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      showToast('Dê um título ao item', 'error');
      return;
    }

    setSaving(true);
    try {
      const item = await api.createWatchlistItem({ title: trimmedTitle, type, note: note.trim() });
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
        />
      </Field>

      <Field label="Tipo">
        <div className="watchlist-type-toggle">
          {Object.entries(TYPE_META).map(([key, meta]) => (
            <button
              key={key}
              type="button"
              className={`watchlist-type-toggle-btn${type === key ? ' is-active' : ''}`}
              style={{ '--watch-type-color': `var(${meta.colorVar})` }}
              onClick={() => setType(key)}
            >
              <span aria-hidden="true">{meta.emoji}</span> {meta.label}
            </button>
          ))}
        </div>
      </Field>

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
