import { useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { useDeviceTilt } from '../../hooks/useDeviceTilt.js';
import { useEmotionJarPhysics } from '../../hooks/useEmotionJarPhysics.js';
import { personColorFor } from '../calendar/calendarUtils.js';
import { MAX_BEAM_TILT_DEG } from './candyConfig.js';
import { candyColorMix, formatScore, initialsOf, intensityForDuration, scaleForElapsed } from './candyUtils.js';

function toBlobEntry(entry, baseColor) {
  return {
    _id: entry._id,
    intensity: intensityForDuration(entry.durationMs),
    color: candyColorMix(scaleForElapsed(entry.durationMs), baseColor),
  };
}

// Um prato = seu próprio contêiner físico independente, reaproveitando
// literalmente o hook da jarra de emoções (mesma gravidade/colisão/pop),
// só alimentado com entradas no formato que ele já espera. O piso em arco e
// a sombra são só decoração por baixo das bolinhas — a física continua
// tratando o chão como reto (não depende de x), por isso o arco é raso.
function CandyPan({ entries, resetKey, gravityAngleRef, wakeSignal }) {
  const containerRef = useRef(null);
  const { blobs, wakeForGravityChange } = useEmotionJarPhysics(entries, containerRef, resetKey, gravityAngleRef);

  // Acorda bolinhas já assentadas quando a inclinação real do aparelho muda
  // o bastante (ver useDeviceTilt) — cada prato tem seu próprio contêiner
  // físico, mas os dois compartilham a mesma leitura de sensor.
  useEffect(() => {
    if (wakeSignal) wakeForGravityChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wakeSignal]);

  return (
    <div className="candy-justice-pan" ref={containerRef}>
      <svg className="candy-pan-rim" viewBox="0 0 130 10" preserveAspectRatio="none" aria-hidden="true">
        <path d="M6,7 Q65,-2 124,7" fill="none" stroke="var(--color-border-strong)" strokeWidth="2" strokeLinecap="round" />
      </svg>
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

function ScaleSide({ name, color, entries, resetKey, total, offsetPx, gravityAngleRef, wakeSignal }) {
  return (
    <div className="candy-justice-pan-wrap" style={{ transform: `translateY(${offsetPx}px)` }}>
      <CandyPan entries={entries} resetKey={resetKey} gravityAngleRef={gravityAngleRef} wakeSignal={wakeSignal} />
      <div className="candy-justice-avatar" style={{ background: color }}>
        {initialsOf(name)}
      </div>
      <strong className="candy-justice-name">{name}</strong>
      <span className="candy-justice-weight">{formatScore(total)}</span>
    </div>
  );
}

// Deslocamento vertical máximo do prato (px) pro lado mais pesado "descer" e
// o mais leve "subir", reforçando a ligação visual com a inclinação da viga.
const MAX_PAN_OFFSET_PX = 6;

// Geometria da viga — calculada via seno/cosseno em vez de CSS
// transform:rotate() numa <g> (que depende de transform-box: view-box, cujo
// suporte não dava pra confirmar visualmente). Pino fica no centro (150,14);
// a viga gira ao redor dele, os fios saem de cada ponta até quase a base do
// SVG, sempre quase verticais (fio pendurado por gravidade, só o ponto de
// fixação em cima muda com a inclinação).
const PIVOT = { x: 150, y: 14 };
const HALF_BEAM = 85;
const ROPE_BOTTOM_Y = 58;

export function JusticeScale({ users, weekEntries, resetKey, holdSlot }) {
  const { user: me } = useAuth();
  const partner = users.find((u) => u._id !== me?._id);
  const { gravityAngleRef, wakeSignal } = useDeviceTilt();

  const leftRaw = useMemo(() => weekEntries.filter((e) => e.user?._id === me?._id), [weekEntries, me]);
  const rightRaw = useMemo(
    () => weekEntries.filter((e) => partner && e.user?._id === partner._id),
    [weekEntries, partner]
  );

  const leftTotal = leftRaw.reduce((sum, e) => sum + e.durationMs, 0);
  const rightTotal = rightRaw.reduce((sum, e) => sum + e.durationMs, 0);
  const beamTiltDeg = (MAX_BEAM_TILT_DEG * (rightTotal - leftTotal)) / (leftTotal + rightTotal || 1);
  const tiltRatio = beamTiltDeg / MAX_BEAM_TILT_DEG;

  const leftColor = personColorFor(users, me?._id);
  const rightColor = personColorFor(users, partner?._id);
  const leftEntries = useMemo(() => leftRaw.map((e) => toBlobEntry(e, leftColor)), [leftRaw, leftColor]);
  const rightEntries = useMemo(() => rightRaw.map((e) => toBlobEntry(e, rightColor)), [rightRaw, rightColor]);

  const rad = (beamTiltDeg * Math.PI) / 180;
  const leftBeamEnd = { x: PIVOT.x - HALF_BEAM * Math.cos(rad), y: PIVOT.y - HALF_BEAM * Math.sin(rad) };
  const rightBeamEnd = { x: PIVOT.x + HALF_BEAM * Math.cos(rad), y: PIVOT.y + HALF_BEAM * Math.sin(rad) };

  return (
    <div className="candy-justice-scale">
      <svg viewBox="0 0 300 60" className="candy-justice-beam-svg" aria-hidden="true">
        {/* Suporte central — sólido e fixo, não gira com a viga */}
        <path d="M150,14 L136,34 L164,34 Z" fill="var(--color-border-strong)" />
        <rect x="128" y="32" width="44" height="4" rx="2" fill="var(--color-border-strong)" />

        {/* Fios — de cada ponta da viga até quase a base do prato */}
        <line x1={leftBeamEnd.x} y1={leftBeamEnd.y} x2={leftBeamEnd.x} y2={ROPE_BOTTOM_Y} stroke="var(--color-border-strong)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1={rightBeamEnd.x} y1={rightBeamEnd.y} x2={rightBeamEnd.x} y2={ROPE_BOTTOM_Y} stroke="var(--color-border-strong)" strokeWidth="1.5" strokeLinecap="round" />

        {/* Viga */}
        <line x1={leftBeamEnd.x} y1={leftBeamEnd.y} x2={rightBeamEnd.x} y2={rightBeamEnd.y} stroke="var(--color-border-strong)" strokeWidth="3" strokeLinecap="round" />
        <circle cx={PIVOT.x} cy={PIVOT.y} r="4" fill="var(--color-border-strong)" />
      </svg>

      <div className="candy-justice-pans">
        {me && (
          <ScaleSide
            name={me.name}
            color={leftColor}
            entries={leftEntries}
            resetKey={resetKey}
            total={leftTotal}
            offsetPx={-tiltRatio * MAX_PAN_OFFSET_PX}
            gravityAngleRef={gravityAngleRef}
            wakeSignal={wakeSignal}
          />
        )}
        {partner && (
          <ScaleSide
            name={partner.name}
            color={rightColor}
            entries={rightEntries}
            resetKey={resetKey}
            total={rightTotal}
            offsetPx={tiltRatio * MAX_PAN_OFFSET_PX}
            gravityAngleRef={gravityAngleRef}
            wakeSignal={wakeSignal}
          />
        )}
      </div>

      {holdSlot && <div className="candy-justice-hold-center">{holdSlot}</div>}
    </div>
  );
}
