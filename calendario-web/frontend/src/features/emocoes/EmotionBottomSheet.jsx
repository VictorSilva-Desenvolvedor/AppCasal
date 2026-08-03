import { Icon } from '../../components/ui/index.js';
import { useDialogFocus } from '../../hooks/useDialogFocus.js';

// Bottom sheet próprio da feature (em vez do Modal genérico centralizado):
// mesma técnica de sempre-montado + Escape/clique-fora do Modal.jsx, mas
// sobe de baixo pra cima, com barra de arraste, conforme a identidade visual.
export function EmotionBottomSheet({ open, onClose, label, children }) {
  // Escape, foco inicial, prisão do Tab e devolução do foco ao fechar.
  const sheetRef = useDialogFocus(open, onClose);

  return (
    <div
      className={`emotion-sheet-overlay${open ? ' is-open' : ''}`}
      // Fechado o overlay continua no DOM (a transição CSS depende disso), então
      // inert é o que impede o Tab e o leitor de tela de alcançarem o conteúdo.
      inert={!open}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="emotion-sheet" role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} ref={sheetRef}>
        <div className="emotion-sheet-handle" />
        <button type="button" className="icon-btn emotion-sheet-close" onClick={onClose} aria-label="Fechar">
          <Icon name="x" />
        </button>
        {children}
      </div>
    </div>
  );
}
