import { useId } from 'react';
import { Button } from './Button.jsx';
import { useDialogFocus } from '../../hooks/useDialogFocus.js';

// Confirmação genérica para ações destrutivas. Reaproveita o visual do Modal
// (.modal-overlay/.modal, inclusive a transição e o formato de bottom-sheet no
// mobile), mas com role="alertdialog" e o foco preso pelo useDialogFocus — o
// Modal.jsx não faz focus trap nem devolve o foco ao fechar.
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Remover',
  cancelLabel = 'Cancelar',
  loading = false,
  onCancel,
  onConfirm,
}) {
  const dialogRef = useDialogFocus(open, onCancel);
  const titleId = useId();
  const messageId = useId();

  return (
    <div
      className={`modal-overlay confirm-overlay${open ? ' is-open' : ''}`}
      inert={!open}
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        className="card modal confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={message ? messageId : undefined}
        tabIndex={-1}
        ref={dialogRef}
      >
        <h2 id={titleId} className="confirm-title">
          {title}
        </h2>
        {message && (
          <p id={messageId} className="confirm-message">
            {message}
          </p>
        )}
        <div className="confirm-actions">
          <Button type="button" variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button type="button" variant="danger" loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
