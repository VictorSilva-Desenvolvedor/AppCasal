import { useCallback, useEffect, useRef, useState } from 'react';
import { MAX_HOLD_MS } from './candyConfig.js';
import { candyColorMix, formatScore, scaleForElapsed } from './candyUtils.js';

const RING_SIZE = 76;
const RING_STROKE = 4;
const RING_R = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;

export function CandyHoldButton({ onLogged, submitting, color }) {
  const [holding, setHolding] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  const startRef = useRef(0);
  const rafRef = useRef(null);
  const submittedRef = useRef(false);

  const stopLoop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  const finish = useCallback(
    (durationMs) => {
      stopLoop();
      setHolding(false);
      setElapsedMs(0);
      onLogged(durationMs);
    },
    [onLogged, stopLoop]
  );

  const tick = useCallback(() => {
    const delta = Date.now() - startRef.current;
    if (delta >= MAX_HOLD_MS) {
      if (!submittedRef.current) {
        submittedRef.current = true;
        finish(MAX_HOLD_MS);
      }
      return;
    }
    setElapsedMs(delta);
    rafRef.current = requestAnimationFrame(tick);
  }, [finish]);

  const startHold = useCallback(() => {
    if (holding) return;
    submittedRef.current = false;
    startRef.current = Date.now();
    setHolding(true);
    rafRef.current = requestAnimationFrame(tick);
  }, [holding, tick]);

  function handlePointerDown(event) {
    event.preventDefault();
    // Prende o ponteiro ao botão: sem isso, o dedo escorregar alguns pixels
    // durante o "segurar" dispara pointerleave e joga o registro fora.
    event.currentTarget.setPointerCapture?.(event.pointerId);
    startHold();
  }

  // Teclado: o mesmo gesto de segurar, com Espaço/Enter mantidos pressionados.
  function handleKeyDown(event) {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    if (event.repeat) return;
    startHold();
  }

  function handleKeyUp(event) {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    handleRelease();
  }

  function handleRelease() {
    if (!holding || submittedRef.current) return;
    submittedRef.current = true;
    finish(Math.min(Date.now() - startRef.current, MAX_HOLD_MS));
  }

  function handleCancel() {
    if (submittedRef.current) return;
    stopLoop();
    setHolding(false);
    setElapsedMs(0);
  }

  useEffect(() => stopLoop, [stopLoop]);

  const liveScale = holding ? scaleForElapsed(elapsedMs) : 1;
  const liveColor = candyColorMix(liveScale, color);
  const progress = holding ? Math.min(elapsedMs / MAX_HOLD_MS, 1) : 0;

  return (
    <div className="candy-hold-stage">
      {holding && (
        <div className="candy-hold-preview" style={{ transform: `translateX(-50%) scale(${liveScale})`, background: liveColor }} />
      )}
      <svg className="candy-hold-ring" viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} aria-hidden="true">
        <circle className="candy-hold-ring-track" cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R} />
        <circle
          className="candy-hold-ring-progress"
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_R}
          stroke={liveColor}
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress)}
        />
      </svg>
      <button
        type="button"
        className={`candy-hold-trigger${holding ? ' is-holding' : ''}`}
        disabled={submitting}
        aria-label={holding ? undefined : 'Segurar para registrar um doce'}
        onPointerDown={handlePointerDown}
        onPointerUp={handleRelease}
        onPointerLeave={handleCancel}
        onPointerCancel={handleCancel}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onBlur={handleCancel}
      >
        {holding ? formatScore(elapsedMs) : 'Segurar'}
      </button>
    </div>
  );
}
