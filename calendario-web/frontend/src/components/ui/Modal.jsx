import { useEffect, useId } from 'react';
import { Icon } from './Icon.jsx';

// Fica sempre montado (mesmo fechado) para que a transição CSS de
// opacity/visibility de .modal-overlay (components.css) funcione — igual ao
// comportamento original, que nunca removia o overlay do DOM.
export function Modal({ open, onClose, title, children }) {
  // Uma tela pode montar vários Modals ao mesmo tempo (Hábitos monta 3), então
  // o id do título precisa ser único — senão o aria-labelledby do modal aberto
  // aponta pro título de um modal fechado.
  const titleId = useId();

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
      <div className="card modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal-header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="modal-close" aria-label="Fechar" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
