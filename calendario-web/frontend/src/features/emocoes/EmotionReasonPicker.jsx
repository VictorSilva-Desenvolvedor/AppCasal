import { Field, Icon } from '../../components/ui/index.js';
import { REASONS, REASON_ORDER } from '../../constants/emotionReasons.js';

export function EmotionReasonPicker({
  selectedReasons,
  otherText,
  onToggleReason,
  onOtherTextChange,
  emotionColor,
  onBack,
  onSkip,
  onSave,
  saving,
  error,
}) {
  const isOtherSelected = selectedReasons.includes('outro');

  return (
    <div className="emotion-reason-panel">
      <button type="button" className="icon-btn emotion-sheet-back" onClick={onBack} aria-label="Voltar">
        <Icon name="chevron-left" />
      </button>

      <p className="emotion-reason-label">Motivo (opcional)</p>

      <div className="emotion-reason-chips">
        {REASON_ORDER.map((key) => {
          const reason = REASONS[key];
          const active = selectedReasons.includes(key);
          return (
            <button
              key={key}
              type="button"
              className={`emotion-reason-chip${active ? ' is-active' : ''}`}
              style={active ? { '--chip-active-color': emotionColor } : undefined}
              onClick={() => onToggleReason(key)}
            >
              <Icon name={reason.icon} />
              <span>{reason.label}</span>
            </button>
          );
        })}
      </div>

      {isOtherSelected && (
        <Field label="Conte em poucas palavras">
          <input
            type="text"
            maxLength={60}
            placeholder="Ex.: trânsito, prova, etc."
            value={otherText}
            disabled={saving}
            onChange={(event) => onOtherTextChange(event.target.value)}
          />
        </Field>
      )}

      <p className="error-text">{error}</p>

      <div className="emotion-reason-actions">
        <button type="button" className="emotion-reason-btn emotion-reason-btn--ghost" disabled={saving} onClick={onSkip}>
          Pular
        </button>
        <button type="button" className="emotion-reason-btn emotion-reason-btn--primary" disabled={saving} onClick={onSave}>
          Salvar
        </button>
      </div>
    </div>
  );
}
