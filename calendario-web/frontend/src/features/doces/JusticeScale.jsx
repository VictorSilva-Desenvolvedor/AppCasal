import { useMemo, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { useEmotionJarPhysics } from '../../hooks/useEmotionJarPhysics.js';
import { personColorFor } from '../calendar/calendarUtils.js';
import { MAX_BEAM_TILT_DEG } from './candyConfig.js';
import { candyColorMix, formatScore, initialsOf, intensityForDuration, scaleForElapsed } from './candyUtils.js';

function toBlobEntry(entry) {
  return {
    _id: entry._id,
    intensity: intensityForDuration(entry.durationMs),
    color: candyColorMix(scaleForElapsed(entry.durationMs)),
  };
}

// Um prato = seu próprio contêiner físico independente, reaproveitando
// literalmente o hook da jarra de emoções (mesma gravidade/colisão/pop),
// só alimentado com entradas no formato que ele já espera.
function CandyPan({ entries, resetKey }) {
  const containerRef = useRef(null);
  const { blobs } = useEmotionJarPhysics(entries, containerRef, resetKey);

  return (
    <div className="candy-justice-pan" ref={containerRef}>
      {blobs.map((blob) => (
        <span
          key={blob.id}
          className={`candy-ball${blob.resting ? ' is-settled' : ''}${blob.popping ? ' is-popping' : ''}`}
          style={{
            width: blob.r * 2,
            height: blob.r * 2,
            '--ball-color': blob.color,
            transform: `translate(${blob.x - blob.r}px, ${blob.y - blob.r}px)`,
          }}
        >
          <span className="candy-ball-inner" />
        </span>
      ))}
    </div>
  );
}

function ScaleSide({ name, color, entries, resetKey, total }) {
  return (
    <div className="candy-justice-pan-wrap">
      <CandyPan entries={entries} resetKey={resetKey} />
      <div className="candy-justice-avatar" style={{ background: color }}>
        {initialsOf(name)}
      </div>
      <strong className="candy-justice-name">{name}</strong>
      <span className="candy-justice-weight">{formatScore(total)}</span>
    </div>
  );
}

export function JusticeScale({ users, weekEntries, resetKey }) {
  const { user: me } = useAuth();
  const partner = users.find((u) => u._id !== me?._id);

  const leftRaw = useMemo(() => weekEntries.filter((e) => e.user?._id === me?._id), [weekEntries, me]);
  const rightRaw = useMemo(
    () => weekEntries.filter((e) => partner && e.user?._id === partner._id),
    [weekEntries, partner]
  );

  const leftTotal = leftRaw.reduce((sum, e) => sum + e.durationMs, 0);
  const rightTotal = rightRaw.reduce((sum, e) => sum + e.durationMs, 0);
  const beamTiltDeg = (MAX_BEAM_TILT_DEG * (rightTotal - leftTotal)) / (leftTotal + rightTotal || 1);

  const leftEntries = useMemo(() => leftRaw.map(toBlobEntry), [leftRaw]);
  const rightEntries = useMemo(() => rightRaw.map(toBlobEntry), [rightRaw]);

  return (
    <div className="candy-justice-scale">
      <svg viewBox="0 0 300 74" className="candy-justice-beam-svg" aria-hidden="true">
        <rect x="145" y="34" width="10" height="34" rx="3" fill="var(--color-border-strong)" />
        <circle cx="150" cy="30" r="8" fill="var(--color-border-strong)" />
        <g
          className="candy-justice-beam"
          style={{ transform: `rotate(${beamTiltDeg}deg)`, transformOrigin: '150px 30px', transformBox: 'view-box' }}
        >
          <rect x="30" y="26" width="240" height="8" rx="4" fill="var(--color-border-strong)" />
          <line x1="70" y1="30" x2="70" y2="60" stroke="var(--color-border-strong)" strokeWidth="3" />
          <line x1="230" y1="30" x2="230" y2="60" stroke="var(--color-border-strong)" strokeWidth="3" />
        </g>
      </svg>

      <div className="candy-justice-pans">
        {me && (
          <ScaleSide
            name={me.name}
            color={personColorFor(users, me._id)}
            entries={leftEntries}
            resetKey={resetKey}
            total={leftTotal}
          />
        )}
        {partner && (
          <ScaleSide
            name={partner.name}
            color={personColorFor(users, partner._id)}
            entries={rightEntries}
            resetKey={resetKey}
            total={rightTotal}
          />
        )}
      </div>
    </div>
  );
}
