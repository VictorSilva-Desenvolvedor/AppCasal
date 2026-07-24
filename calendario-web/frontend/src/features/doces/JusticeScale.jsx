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
// só alimentado com entradas no formato que ele já espera. O piso em arco e
// a sombra são só decoração por baixo das bolinhas — a física continua
// tratando o chão como reto (não depende de x), por isso o arco é raso.
function CandyPan({ entries, resetKey }) {
  const containerRef = useRef(null);
  const { blobs } = useEmotionJarPhysics(entries, containerRef, resetKey);

  return (
    <div className="candy-justice-pan" ref={containerRef}>
      <svg className="candy-pan-floor" viewBox="0 0 130 22" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M6,3 Q6,19 65,19 Q124,19 124,3"
          fill="none"
          stroke="var(--color-border-strong)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <div className="candy-pan-shadow" aria-hidden="true" />
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

function ScaleSide({ name, color, entries, resetKey, total, holdSlot }) {
  return (
    <div className="candy-justice-pan-wrap">
      {holdSlot && <div className="candy-justice-hold-slot">{holdSlot}</div>}
      <CandyPan entries={entries} resetKey={resetKey} />
      <div className="candy-justice-avatar" style={{ background: color }}>
        {initialsOf(name)}
      </div>
      <strong className="candy-justice-name">{name}</strong>
      <span className="candy-justice-weight">{formatScore(total)}</span>
    </div>
  );
}

export function JusticeScale({ users, weekEntries, resetKey, holdSlot }) {
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
      <svg viewBox="0 0 300 40" className="candy-justice-beam-svg" aria-hidden="true">
        <line x1="150" y1="10" x2="150" y2="24" stroke="var(--color-border-strong)" strokeWidth="2" strokeLinecap="round" />
        <g
          className="candy-justice-beam"
          style={{ transform: `rotate(${beamTiltDeg}deg)`, transformOrigin: '150px 14px', transformBox: 'view-box' }}
        >
          <line x1="40" y1="14" x2="260" y2="14" stroke="var(--color-border-strong)" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="150" cy="14" r="4" fill="none" stroke="var(--color-border-strong)" strokeWidth="1.5" />
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
            holdSlot={holdSlot}
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
