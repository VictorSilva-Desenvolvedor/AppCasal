import { createContext, useCallback, useRef, useState } from 'react';
import { Toast } from '../components/ui/Toast.jsx';

export const ToastContext = createContext(null);

const TOAST_DURATION_MS = 3000;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, message, type, leaving: false }]);

    setTimeout(() => {
      setToasts((prev) =>
        prev.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast)),
      );
    }, TOAST_DURATION_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onLeaveEnd={() => dismissToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
