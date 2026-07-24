import { useRef, useState } from 'react';
import { Icon } from '../../components/ui/index.js';
import { EMOTIONS } from '../../constants/emotions.js';
import { REASONS } from '../../constants/emotionReasons.js';
import { EmotionIntensityBar } from './EmotionIntensityBar.jsx';

const REVEAL_WIDTH = 72; // px — largura do botão de lixeira revelado atrás da row
const AXIS_THRESHOLD = 8; // px — a partir daqui o gesto é "travado" como horizontal ou vertical
const TAP_THRESHOLD = 6; // px — deslocamento total abaixo disso conta como tap, não swipe

export function EmotionSummaryEntryRow({ entry, canDelete = false, isOpen = false, onOpenChange, onRequestDelete, onOpenDetail }) {
  const meta = EMOTIONS[entry.emotion];
  const reasonTags = (entry.reasons || [])
    .map((key) => [key, REASONS[key]])
    .filter(([, reason]) => reason);
  const [dragX, setDragX] = useState(null); // null = não está arrastando agora (usa isOpen pra decidir a posição)
  const dragRef = useRef(null); // { startX, startY, axis: 'x' | 'y' | null, baseOffset }

  const restingX = isOpen ? -REVEAL_WIDTH : 0;
  const translateX = dragX ?? restingX;

  function handlePointerDown(event) {
    if (!canDelete) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { startX: event.clientX, startY: event.clientY, axis: null, baseOffset: restingX };
  }

  function handlePointerMove(event) {
    const drag = dragRef.current;
    if (!drag) return;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;

    if (drag.axis === null) {
      if (Math.abs(deltaX) > AXIS_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
        drag.axis = 'x';
      } else if (Math.abs(deltaY) > AXIS_THRESHOLD) {
        drag.axis = 'y';
      }
    }

    if (drag.axis === 'x') {
      event.preventDefault();
      const next = Math.min(Math.max(drag.baseOffset + deltaX, -REVEAL_WIDTH), 0);
      setDragX(next);
    }
  }

  function handlePointerEnd(event) {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag) return;

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    const totalMovement = Math.hypot(deltaX, deltaY);

    if (drag.axis === 'x') {
      const finalX = Math.min(Math.max(drag.baseOffset + deltaX, -REVEAL_WIDTH), 0);
      const shouldOpen = finalX <= -REVEAL_WIDTH / 2;
      setDragX(null);
      onOpenChange?.(shouldOpen ? entry._id : null);
      return;
    }

    setDragX(null);

    if (drag.axis === 'y') return; // gesto entregue ao scroll vertical nativo

    // Nenhum eixo travado: foi um tap.
    if (totalMovement < TAP_THRESHOLD) {
      if (isOpen) {
        onOpenChange?.(null);
      } else {
        onOpenDetail?.(entry);
      }
    }
  }

  return (
    <div className="emotion-summary-entry-swipe-wrap">
      {canDelete && (
        <button
          type="button"
          className="emotion-summary-entry-delete"
          aria-label="Remover registro"
          onClick={() => {
            onOpenChange?.(null);
            onRequestDelete?.(entry);
          }}
        >
          <Icon name="trash" />
        </button>
      )}

      <div
        className={`emotion-summary-period-entry${canDelete ? ' is-swipeable' : ''}${dragX !== null ? ' is-dragging' : ''}`}
        style={{ transform: `translateX(${translateX}px)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        <div className="emotion-summary-period-entry-main">
          <span className="emotion-summary-period-entry-label">
            <span aria-hidden="true">{meta?.emoji}</span> {meta?.label}
          </span>
          <EmotionIntensityBar intensity={entry.intensity} color={meta?.color} />
        </div>

        {reasonTags.length > 0 && (
          <div className="emotion-summary-entry-reasons">
            {reasonTags.map(([key, reason]) => (
              <span key={key} className="emotion-summary-entry-reason-tag">
                <Icon name={reason.icon} />
                {key === 'outro' && entry.reasonOther ? entry.reasonOther : reason.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
