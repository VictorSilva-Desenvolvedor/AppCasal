import { useState } from 'react';
import { Button, Field } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useToast } from '../../hooks/useToast.js';
import { EMOTIONS, EMOTION_CATEGORY_LABELS, EMOTION_CATEGORY_ORDER } from '../../constants/emotions.js';

const INTENSITY_LEVELS = [1, 2, 3, 4, 5];

export function EmotionEntryForm({ day, period, onSaved, onCancel }) {
  const [emotion, setEmotion] = useState('');
  const [intensity, setIntensity] = useState(3);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!emotion) {
      setError('Escolha como você está se sentindo');
      return;
    }

    setSaving(true);
    try {
      await api.createEmotionEntry({ day, period, emotion, intensity, note: note.trim() });
      await onSaved();
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="emotion-entry-form" onSubmit={handleSubmit}>
      {EMOTION_CATEGORY_ORDER.map((category) => (
        <div key={category} className="emotion-picker-group">
          <p className="emotion-picker-group-label">{EMOTION_CATEGORY_LABELS[category]}</p>
          <div className="emotion-picker-grid">
            {Object.entries(EMOTIONS)
              .filter(([, meta]) => meta.category === category)
              .map(([key, meta]) => (
                <button
                  key={key}
                  type="button"
                  className={`emotion-picker-btn${emotion === key ? ' is-selected' : ''}`}
                  style={{ '--chip-color': meta.color }}
                  aria-pressed={emotion === key}
                  onClick={() => setEmotion(key)}
                >
                  <span className="emotion-picker-emoji" aria-hidden="true">
                    {meta.emoji}
                  </span>
                  <span className="emotion-picker-label">{meta.label}</span>
                </button>
              ))}
          </div>
        </div>
      ))}

      <div className="emotion-intensity-row">
        <p className="emotion-picker-group-label">Intensidade</p>
        <div className="emotion-intensity-buttons">
          {INTENSITY_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              className={`emotion-intensity-btn${intensity === level ? ' is-selected' : ''}`}
              aria-pressed={intensity === level}
              onClick={() => setIntensity(level)}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <Field label="Observação (opcional)" htmlFor="emotion-note">
        <textarea
          id="emotion-note"
          maxLength={280}
          placeholder="Por que você está se sentindo assim?"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </Field>

      <p className="error-text">{error}</p>

      <div className="emotion-form-actions">
        <Button type="submit" loading={saving}>
          Registrar
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
