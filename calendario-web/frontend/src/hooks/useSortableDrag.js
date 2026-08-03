import { useCallback, useEffect, useRef, useState } from 'react';

/*
  Arraste ordenável baseado em Pointer Events.

  Existe separado de useDragAndDrop.js porque aquele usa a API HTML5 de
  drag-and-drop, que simplesmente não dispara em toque — num app empacotado com
  Capacitor, arrastar com o dedo não funcionaria. Além disso, aquele hook só
  sabe "soltar numa zona": não tem noção de índice, então não reordena.

  Aqui um único caminho de código atende mouse e dedo. A diferença é como o
  arraste começa: no toque exige segurar (senão o gesto roubaria o scroll
  vertical da página), no mouse basta passar de um limiar de movimento (senão
  todo clique viraria arraste).
*/

const LONG_PRESS_MS = 280;
const MOUSE_THRESHOLD_PX = 5;
// O dedo treme; 5px cancelaria arrastes legítimos.
const TOUCH_SLOP_PX = 10;
const AUTO_SCROLL_EDGE_PX = 60;
const AUTO_SCROLL_SPEED_PX = 12;

// Onde a linha de inserção aparece, a partir da posição do ponteiro: cada card
// é dividido ao meio — acima do meio entra antes dele, abaixo entra depois.
// O item em movimento é ignorado (ele está deslocado sob o dedo, e o índice
// devolvido é o da lista já sem ele — que é o que moveTaskItem espera).
function resolveDropTarget(clientX, clientY, excludeId) {
  const element = document.elementFromPoint(clientX, clientY);
  if (!element) return null;

  const zone = element.closest('[data-drop-zone]');
  if (!zone) return null;
  const sectionId = zone.getAttribute('data-drop-zone');

  const cards = Array.from(zone.querySelectorAll('[data-sortable-id]')).filter(
    (card) => card.getAttribute('data-sortable-id') !== excludeId
  );
  let index = cards.length;
  for (let i = 0; i < cards.length; i += 1) {
    const rect = cards[i].getBoundingClientRect();
    if (clientY < rect.top + rect.height / 2) {
      index = i;
      break;
    }
  }

  return { sectionId, index };
}

export function useSortableDrag({ onMove, canDrag = () => true } = {}) {
  const [draggingId, setDraggingId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // O ponteiro dispara dezenas de eventos por segundo, mas a linha de inserção
  // só muda quando troca de vão. Sem esta comparação, cada pixel percorrido
  // re-renderizaria a lista inteira.
  const updateDropTarget = useCallback((next) => {
    setDropTarget((prev) => {
      if (prev === next) return prev;
      if (prev && next && prev.sectionId === next.sectionId && prev.index === next.index) return prev;
      return next;
    });
  }, []);

  // Tudo o que muda a cada pointermove fica em ref: reagir a isso com estado
  // re-renderizaria a lista inteira dezenas de vezes por segundo.
  const gesture = useRef(null);
  const autoScrollRef = useRef(0);

  const cleanup = useCallback(() => {
    if (gesture.current?.pressTimer) clearTimeout(gesture.current.pressTimer);
    if (autoScrollRef.current) {
      cancelAnimationFrame(autoScrollRef.current);
      autoScrollRef.current = 0;
    }
    gesture.current = null;
    setDraggingId(null);
    setDropTarget(null);
    setOffset({ x: 0, y: 0 });
  }, []);

  // Rola a página sozinho quando o dedo encosta nas bordas — sem isso não dá
  // pra mover um item entre períodos que não cabem juntos na tela.
  const runAutoScroll = useCallback(() => {
    const current = gesture.current;
    if (!current?.active) {
      autoScrollRef.current = 0;
      return;
    }

    const { clientY } = current;
    if (clientY < AUTO_SCROLL_EDGE_PX) {
      window.scrollBy(0, -AUTO_SCROLL_SPEED_PX);
    } else if (clientY > window.innerHeight - AUTO_SCROLL_EDGE_PX) {
      window.scrollBy(0, AUTO_SCROLL_SPEED_PX);
    }

    autoScrollRef.current = requestAnimationFrame(runAutoScroll);
  }, []);

  const startDragging = useCallback(() => {
    const current = gesture.current;
    if (!current || current.active) return;
    current.active = true;
    setDraggingId(current.itemId);
    updateDropTarget(resolveDropTarget(current.clientX, current.clientY, current.itemId));
    if (!autoScrollRef.current) autoScrollRef.current = requestAnimationFrame(runAutoScroll);
  }, [runAutoScroll, updateDropTarget]);

  useEffect(() => {
    function handleMove(event) {
      const current = gesture.current;
      if (!current) return;

      current.clientX = event.clientX;
      current.clientY = event.clientY;
      const dx = event.clientX - current.startX;
      const dy = event.clientY - current.startY;

      if (!current.active) {
        // Passar do limiar já inicia, inclusive no toque: o punho tem
        // touch-action:none, então o gesto que começa nele nunca ia rolar a
        // página — esperar os 280ms parado só deixaria o arraste lerdo. O
        // long-press continua valendo pra quem segura sem mover.
        const slop = current.pointerType === 'mouse' ? MOUSE_THRESHOLD_PX : TOUCH_SLOP_PX;
        if (Math.hypot(dx, dy) > slop) startDragging();
        return;
      }

      event.preventDefault();
      setOffset({ x: dx, y: dy });
      updateDropTarget(resolveDropTarget(event.clientX, event.clientY, current.itemId));
    }

    function handleUp() {
      const current = gesture.current;
      if (!current) return;

      const { itemId, active } = current;
      const target = active ? resolveDropTarget(current.clientX, current.clientY, itemId) : null;
      cleanup();
      if (target) onMove?.({ itemId, sectionId: target.sectionId, index: target.index });
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape' && gesture.current) cleanup();
    }

    window.addEventListener('pointermove', handleMove, { passive: false });
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', cleanup);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', cleanup);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [cleanup, onMove, startDragging, updateDropTarget]);

  useEffect(() => cleanup, [cleanup]);

  const handleProps = useCallback(
    (itemId) => {
      if (!canDrag(itemId)) return {};
      return {
        onPointerDown: (event) => {
          // Só botão principal do mouse; o secundário abre menu de contexto.
          if (event.pointerType === 'mouse' && event.button !== 0) return;
          event.currentTarget.setPointerCapture?.(event.pointerId);

          gesture.current = {
            itemId,
            pointerType: event.pointerType,
            startX: event.clientX,
            startY: event.clientY,
            clientX: event.clientX,
            clientY: event.clientY,
            active: false,
            pressTimer:
              event.pointerType === 'mouse' ? null : setTimeout(startDragging, LONG_PRESS_MS),
          };
        },
      };
    },
    [canDrag, startDragging]
  );

  return {
    draggingId,
    dropTarget,
    offset,
    isDragging: (id) => draggingId === id,
    // Props do punho: só ele inicia o arraste. O corpo da linha já tem clique
    // de alternar e seleção de texto, que brigariam com o gesto.
    handleProps,
    zoneProps: (sectionId) => ({ 'data-drop-zone': sectionId }),
    itemProps: (itemId) => ({ 'data-sortable-id': itemId }),
  };
}
