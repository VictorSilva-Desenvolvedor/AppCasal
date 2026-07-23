import { useState } from 'react';
import { Field, Button, Icon } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useToast } from '../../hooks/useToast.js';

export function WatchlistRatingForm({ item, existingRating, onSaved, onCancel }) {
  const { showToast } = useToast();
  const [hearts, setHearts] = useState(existingRating?.hearts ?? 0);
  const [comment, setComment] = useState(existingRating?.comment ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!hearts) {
      showToast('Dê pelo menos 1 coração', 'error');
      return;
    }

    setSaving(true);
    try {
      const rating = existingRating
        ? await api.updateWatchlistRating(existingRating._id, { hearts, comment: comment.trim() })
        : await api.createWatchlistRating({ item: item._id, hearts, comment: comment.trim() });
      showToast('Avaliação salva!', 'success');
      onSaved(rating);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="watchlist-rating-form" onSubmit={handleSubmit}>
      <Field label="Quantos corações?">
        <div className="watchlist-heart-picker">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className="watchlist-heart-picker-btn"
              aria-label={`${n} corações`}
              onClick={() => setHearts(n)}
            >
              <Icon name="heart" className={n <= hearts ? 'is-filled' : ''} />
            </button>
          ))}
        </div>
      </Field>

      <Field label="Comentário (opcional)" htmlFor="watchlist-rating-comment">
        <textarea
          id="watchlist-rating-comment"
          maxLength={280}
          rows={3}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="O que achou?"
        />
      </Field>

      <div className="watchlist-form-actions">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={saving}>
          {existingRating ? 'Salvar' : 'Avaliar'}
        </Button>
      </div>
    </form>
  );
}
