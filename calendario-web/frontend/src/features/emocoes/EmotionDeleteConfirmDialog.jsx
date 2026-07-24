import { useEffect } from 'react';
import { EMOTIONS } from '../../constants/emotions.js';

// Diálogo de confirmação próprio da feature (mesmo precedente de
// EmotionBottomSheet.jsx: sempre montado, Escape/clique-fora fecha) em vez
// do Modal.jsx genérico, pra manter a identidade "glass" escopada da página.
export function EmotionDeleteConfirmDialog({ open, entry, onCancel, onConfirm }) {
  useEffect(() => {
    if (!open) return undefined;
    function handleKeyDown(event) {
      if (event.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  const meta = entry ? EMOTIONS[entry.emotion] : null;

  return (
    <div
      className={`emotion-confirm-overlay${open ? ' is-open' : ''}`}
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div className="emotion-confirm-dialog" role="alertdialog" aria-modal="true">
        <p className="emotion-confirm-text">
          Remover o registro de <span aria-hidden="true">{meta?.emoji}</span> {meta?.label}?
        </p>
        <div className="emotion-confirm-actions">
          <button type="button" className="emotion-confirm-btn emotion-confirm-btn--cancel" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className="emotion-confirm-btn emotion-confirm-btn--danger" onClick={onConfirm}>
            Remover
          </button>
        </div>
      </div>
    </div>
  );
}
