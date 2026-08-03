import { useEffect, useRef } from 'react';

// Overlays da feature de emoções ficam sempre montados (só escondidos por
// visibility/opacity, pra transição CSS funcionar). Isso resolve a animação mas
// deixava 3 buracos de acessibilidade: o foco nunca entrava no diálogo, o Tab
// vazava pro conteúdo atrás e, ao fechar, o foco não voltava pro botão que
// abriu. Este hook cuida dos três e absorve o listener de Escape que estava
// duplicado no EmotionBottomSheet e no EmotionDeleteConfirmDialog.
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function focusableWithin(container) {
  return Array.from(container.querySelectorAll(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement
  );
}

export function useDialogFocus(open, onClose) {
  const containerRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    previousFocusRef.current = document.activeElement;
    const container = containerRef.current;

    // Foca o primeiro controle real; se o diálogo não tiver nenhum, foca o
    // próprio container (que recebe tabIndex={-1} nos componentes).
    const first = container ? focusableWithin(container)[0] : null;
    (first ?? container)?.focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !container) return;

      const focusables = focusableWithin(container);
      if (!focusables.length) {
        event.preventDefault();
        return;
      }

      const firstEl = focusables[0];
      const lastEl = focusables[focusables.length - 1];

      // Ciclo manual nas pontas — sem isso o Tab escapa pro conteúdo de trás,
      // que continua no DOM porque o overlay nunca é desmontado.
      if (event.shiftKey && document.activeElement === firstEl) {
        event.preventDefault();
        lastEl.focus();
      } else if (!event.shiftKey && document.activeElement === lastEl) {
        event.preventDefault();
        firstEl.focus();
      } else if (!container.contains(document.activeElement)) {
        event.preventDefault();
        firstEl.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Devolve o foco a quem abriu, mas só se ele ainda estiver na página.
      const previous = previousFocusRef.current;
      if (previous?.isConnected) previous.focus();
    };
  }, [open, onClose]);

  return containerRef;
}
