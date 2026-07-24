import { useCallback, useEffect, useRef, useState } from 'react';
import { MAX_HOLD_MS } from './candyConfig.js';
import { candyColorMix, formatDuration, scaleForElapsed } from './candyUtils.js';

export function CandyHoldButton({ onLogged, submitting }) {
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

  function handlePointerDown(event) {
    event.preventDefault();
    submittedRef.current = false;
    startRef.current = Date.now();
    setHolding(true);
    rafRef.current = requestAnimationFrame(tick);
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
  const liveColor = candyColorMix(liveScale);

  return (
    <div className="candy-hold-wrap">
      <div className="candy-hold-stage">
        {holding && (
          <div className="candy-hold-preview" style={{ transform: `scale(${liveScale})`, background: liveColor }} />
        )}
        <button
          type="button"
          className={`candy-hold-trigger${holding ? ' is-holding' : ''}`}
          disabled={submitting}
          onPointerDown={handlePointerDown}
          onPointerUp={handleRelease}
          onPointerLeave={handleCancel}
          onPointerCancel={handleCancel}
        >
          {holding ? formatDuration(elapsedMs) : 'Segurar'}
        </button>
      </div>

      <p className="candy-hold-hint">
        Segure enquanto come — quanto mais tempo, mais pesou o deslize (máx. {formatDuration(MAX_HOLD_MS)}).
      </p>
    </div>
  );
}
