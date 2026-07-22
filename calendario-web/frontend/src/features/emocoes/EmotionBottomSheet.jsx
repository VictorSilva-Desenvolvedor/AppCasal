import { useEffect } from 'react';
import { Icon } from '../../components/ui/index.js';

// Bottom sheet próprio da feature (em vez do Modal genérico centralizado):
// mesma técnica de sempre-montado + Escape/clique-fora do Modal.jsx, mas
// sobe de baixo pra cima, com barra de arraste, conforme a identidade visual.
export function EmotionBottomSheet({ open, onClose, children }) {
  useEffect(() => {
    if (!open) return undefined;
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <div
      className={`emotion-sheet-overlay${open ? ' is-open' : ''}`}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="emotion-sheet" role="dialog" aria-modal="true">
        <div className="emotion-sheet-handle" />
        <button type="button" className="icon-btn emotion-sheet-close" onClick={onClose} aria-label="Fechar">
          <Icon name="x" />
        </button>
        {children}
      </div>
    </div>
  );
}
