import { useEffect } from 'react';
import { Icon } from './Icon.jsx';

// Fica sempre montado (mesmo fechado) para que a transição CSS de
// opacity/visibility de .modal-overlay (components.css) funcione — igual ao
// comportamento original, que nunca removia o overlay do DOM.
export function Modal({ open, onClose, title, children }) {
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
      className={`modal-overlay${open ? ' is-open' : ''}`}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="card modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button type="button" className="modal-close" aria-label="Fechar" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
