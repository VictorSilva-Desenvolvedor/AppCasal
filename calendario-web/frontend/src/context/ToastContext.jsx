import { createContext, useCallback, useRef, useState } from 'react';
import { Toast } from '../components/ui/Toast.jsx';

export const ToastContext = createContext(null);

const TOAST_DURATION_MS = 3000;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);
  // timeoutId de cada toast, pra poder cancelar o auto-dismiss quando o
  // botão de ação (ex.: "Desfazer") for clicado antes do tempo expirar.
  const timeoutsRef = useRef(new Map());

  const startLeave = useCallback((id) => {
    setToasts((prev) => prev.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast)));
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = 'success', options = {}) => {
      const { action, duration = TOAST_DURATION_MS } = options;
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, message, type, action, leaving: false }]);

      const timeoutId = setTimeout(() => {
        timeoutsRef.current.delete(id);
        startLeave(id);
      }, duration);
      timeoutsRef.current.set(id, timeoutId);
    },
    [startLeave],
  );

  const handleAction = useCallback(
    (id, onClick) => {
      const timeoutId = timeoutsRef.current.get(id);
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutsRef.current.delete(id);
      }
      onClick?.();
      startLeave(id);
    },
    [startLeave],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            leaving={toast.leaving}
            actionLabel={toast.action?.label}
            onAction={toast.action ? () => handleAction(toast.id, toast.action.onClick) : undefined}
            onLeaveEnd={() => dismissToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
