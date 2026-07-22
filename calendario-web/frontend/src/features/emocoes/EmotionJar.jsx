import { useMemo, useRef } from 'react';
import { EMOTIONS } from '../../constants/emotions.js';
import { useEmotionJarPhysics } from '../../hooks/useEmotionJarPhysics.js';

export function EmotionJar({ entries, resetKey }) {
  const containerRef = useRef(null);

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

  const { blobs } = useEmotionJarPhysics(blobEntries, containerRef, resetKey);

  return (
    <div className="emotion-jar">
      <div className="emotion-jar-lid" />
      <div className="emotion-jar-glass" ref={containerRef}>
        {blobs.map((blob) => (
          <span
            key={blob.id}
            className={`emotion-blob${blob.resting ? ' is-settled' : ''}`}
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
