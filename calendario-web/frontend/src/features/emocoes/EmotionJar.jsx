import { useMemo, useRef, useState } from 'react';
import { EMOTIONS } from '../../constants/emotions.js';
import { useEmotionJarPhysics } from '../../hooks/useEmotionJarPhysics.js';

const MAX_DRAG_OFFSET = 70; // px — até onde a jarra pode "escorregar" ao ser sacudida

export function EmotionJar({ entries, resetKey }) {
  const containerRef = useRef(null);
  const dragRef = useRef(null); // { lastX } enquanto o ponteiro está pressionado
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const blobEntries = useMemo(
    () =>
      entries.map((entry) => ({
        _id: entry._id,
        intensity: entry.intensity,
        color: EMOTIONS[entry.emotion]?.color || '#94a3b8',
        category: EMOTIONS[entry.emotion]?.category || 'neutra',
      })),
    [entries]
  );

  const { blobs, shake } = useEmotionJarPhysics(blobEntries, containerRef, resetKey);

  function handlePointerDown(event) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { lastX: event.clientX };
    setIsDragging(true);
  }

  function handlePointerMove(event) {
    if (!dragRef.current) return;
    const deltaX = event.clientX - dragRef.current.lastX;
    dragRef.current.lastX = event.clientX;
    setOffsetX((prev) => Math.min(Math.max(prev + deltaX, -MAX_DRAG_OFFSET), MAX_DRAG_OFFSET));
    shake(deltaX);
  }

  function handlePointerEnd() {
    if (!dragRef.current) return;
    dragRef.current = null;
    setIsDragging(false);
    // Solavanco de assentar de volta ao centro, proporcional ao quanto a
    // jarra estava deslocada — a física reage de novo, mesmo depois de solto.
    shake(-offsetX * 0.5);
    setOffsetX(0);
  }

  return (
    <div
      className={`emotion-jar${isDragging ? ' is-dragging' : ''}`}
      style={{ transform: `translateX(${offsetX}px)` }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
    >
      <div className="emotion-jar-lid" />
      <div className="emotion-jar-glass" ref={containerRef}>
        {blobs.map((blob) => (
          <span
            key={blob.id}
            className={`emotion-blob${blob.resting ? ' is-settled' : ''}${blob.popping ? ' is-popping' : ''}`}
            data-category={blob.category}
            style={{
              width: blob.r * 2,
              height: blob.r * 2,
              '--blob-color': blob.color,
              transform: `translate(${blob.x - blob.r}px, ${blob.y - blob.r}px)`,
            }}
          >
            <span className="emotion-blob-inner" />
          </span>
        ))}
        {blobs.length === 0 && <p className="emotion-jar-empty-hint">A jarra está vazia — registre como você está se sentindo</p>}
      </div>
    </div>
  );
}
