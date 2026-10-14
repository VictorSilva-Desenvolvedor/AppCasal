import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon.jsx';

// Quantos Modals estão abertos agora: o #root só volta a ser interativo quando
// o último fechar (há telas que abrem um Modal por cima de outro).
let openModals = 0;

function setAppInert(inert) {
  const root = document.getElementById('root');
  if (root) root.inert = inert;
}

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

  // Com o modal aberto, o app por trás fica inert: sem isso o Tab e o leitor
  // de tela alcançavam a página de fundo, e um botão homônimo atrás (ex.: o
  // "Criar hábito" da página) competia com o do diálogo.
  useEffect(() => {
    if (!open) return undefined;
    openModals += 1;
    setAppInert(true);
    return () => {
      openModals -= 1;
      if (openModals === 0) setAppInert(false);
    };
  }, [open]);

  // Portal no body pelo mesmo motivo do ConfirmDialog e porque o overlay
  // precisa ficar fora do #root, que fica inert enquanto o modal está aberto.
  return createPortal(
    <div
      className={`modal-overlay${open ? ' is-open' : ''}`}
      inert={!open}
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
    </div>,
    document.body
  );
}
