import { useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { useDeviceTilt } from '../../hooks/useDeviceTilt.js';
import { useEmotionJarPhysics } from '../../hooks/useEmotionJarPhysics.js';
import { personColorFor, personTextColorFor } from '../calendar/calendarUtils.js';
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
// Tigela: borda reta de BOWL_RIM px e, abaixo, meia elipse até o fundo. O
// desenho (SVG) e a física usam a mesma conta, então o doce não vaza da linha.
const BOWL_RIM = 22;
const BOWL_INSET = 2; // metade da espessura da linha

function bowlFloorAt(x, r, { width, height }) {
  const a = width / 2 - BOWL_INSET - r;
  const depth = height - BOWL_RIM - BOWL_INSET - r;
  const u = Math.min(Math.abs(x - width / 2) / Math.max(a, 1), 1);
  return BOWL_RIM + depth * Math.sqrt(1 - u * u);
}

function CandyPan({ entries, resetKey, gravityAngleRef, wakeSignal }) {
  const containerRef = useRef(null);
  const { blobs, wakeForGravityChange } = useEmotionJarPhysics(entries, containerRef, resetKey, gravityAngleRef, false, bowlFloorAt);

  // Acorda bolinhas já assentadas quando a inclinação real do aparelho muda
  // o bastante (ver useDeviceTilt) — cada prato tem seu próprio contêiner
  // físico, mas os dois compartilham a mesma leitura de sensor.
  useEffect(() => {
    if (wakeSignal) wakeForGravityChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wakeSignal]);

  return (
    <div className="candy-justice-pan" ref={containerRef}>
      {/* A tigela em pesponto, no mesmo contorno de bowlFloorAt. */}
      <svg className="candy-pan-bowl" viewBox="0 0 130 72" preserveAspectRatio="none" aria-hidden="true">
        <path d="M4,7 Q65,1 126,7" className="candy-thread candy-thread--pan" />
        <path d="M2,7 L2,22 A63,48 0 0 0 128,22 L128,7" className="candy-thread candy-thread--pan" />
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

function ScaleSide({ name, color, textColor, entries, resetKey, total, offsetPx, gravityAngleRef, wakeSignal }) {
  return (
    <div className="candy-justice-pan-wrap" style={{ transform: `translateY(${offsetPx}px)` }}>
      <CandyPan entries={entries} resetKey={resetKey} gravityAngleRef={gravityAngleRef} wakeSignal={wakeSignal} />
      <div className="candy-justice-avatar" style={{ background: color, color: textColor }}>
        {initialsOf(name)}
      </div>
      <strong className="candy-justice-name">{name}</strong>
      <span className="candy-justice-weight">
        {entries.length === 0 ? 'nenhum doce' : `${entries.length} ${entries.length === 1 ? 'doce' : 'doces'} · ${formatScore(total)}`}
      </span>
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

export function JusticeScale({ users, weekEntries, resetKey }) {
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
        <path d="M150,14 L136,34 L164,34 Z" fill="var(--candy-wood)" />
        <rect x="126" y="32" width="48" height="5" rx="2.5" fill="var(--candy-wood-dark)" />

        {/* Fios — de cada ponta da viga até quase a base do prato */}
        <line x1={leftBeamEnd.x} y1={leftBeamEnd.y} x2={leftBeamEnd.x} y2={ROPE_BOTTOM_Y} className="candy-thread candy-thread--rope" />
        <line x1={rightBeamEnd.x} y1={rightBeamEnd.y} x2={rightBeamEnd.x} y2={ROPE_BOTTOM_Y} className="candy-thread candy-thread--rope" />

        {/* Viga */}
        <line x1={leftBeamEnd.x} y1={leftBeamEnd.y} x2={rightBeamEnd.x} y2={rightBeamEnd.y} className="candy-thread candy-thread--beam" />
        <circle cx={PIVOT.x} cy={PIVOT.y} r="4.5" fill="var(--candy-wood-dark)" />
      </svg>

      <div className="candy-justice-pans">
        {me && (
          <ScaleSide
            name={me.name}
            color={leftColor}
            textColor={personTextColorFor(users, me._id)}
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
            textColor={personTextColorFor(users, partner._id)}
            entries={rightEntries}
            resetKey={resetKey}
            total={rightTotal}
            offsetPx={tiltRatio * MAX_PAN_OFFSET_PX}
            gravityAngleRef={gravityAngleRef}
            wakeSignal={wakeSignal}
          />
        )}
      </div>
    </div>
  );
}
