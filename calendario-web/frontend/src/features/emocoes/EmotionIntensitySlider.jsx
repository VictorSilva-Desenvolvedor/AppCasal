import { useState } from 'react';
import { Field, Icon } from '../../components/ui/index.js';
import { EMOTIONS } from '../../constants/emotions.js';
import { radiusForIntensity } from '../../hooks/useEmotionJarPhysics.js';

const DEFAULT_INTENSITY = 3;

export function EmotionIntensitySlider({ emotion, note, onNoteChange, onBack, onIntensityChosen, saving, error }) {
  const [previewIntensity, setPreviewIntensity] = useState(DEFAULT_INTENSITY);
  const meta = EMOTIONS[emotion];
  const diameter = radiusForIntensity(previewIntensity) * 2;
  const fillPercent = ((previewIntensity - 1) / 4) * 100;

  return (
    <div className="emotion-intensity-panel">
      <button type="button" className="icon-btn emotion-sheet-back" onClick={onBack} aria-label="Voltar">
        <Icon name="chevron-left" />
      </button>

      <div className="emotion-intensity-preview">
        <span
          className="emotion-intensity-preview-sphere"
          style={{ width: diameter, height: diameter, '--preview-color': meta?.color }}
        />
      </div>

      <p className="emotion-intensity-emotion-label">
        <span aria-hidden="true">{meta?.emoji}</span> {meta?.label}
      </p>

      <Field label="Observação (opcional)" htmlFor="emotion-note">
        <textarea
          id="emotion-note"
          maxLength={280}
          placeholder="Quer escrever mais sobre isso? (opcional)"
          value={note}
          disabled={saving}
          onChange={(event) => onNoteChange(event.target.value)}
        />
      </Field>

      <div className="emotion-intensity-slider-wrap">
        <input
          type="range"
          min="1"
          max="5"
          step="1"
          value={previewIntensity}
          disabled={saving}
          className="emotion-intensity-range"
          style={{ '--fill-color': meta?.color, '--fill-percent': `${fillPercent}%` }}
          onInput={(event) => setPreviewIntensity(Number(event.target.value))}
          onChange={(event) => onIntensityChosen(Number(event.target.value))}
        />
        <div className="emotion-intensity-slider-labels">
          <span>Leve</span>
          <span>Moderada</span>
          <span>Intensa</span>
        </div>
      </div>

      <p className="error-text">{error}</p>
    </div>
  );
}
