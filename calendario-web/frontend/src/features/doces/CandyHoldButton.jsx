import { useCallback, useEffect, useRef, useState } from 'react';
import { MAX_HOLD_MS } from './candyConfig.js';
import { formatDuration } from './candyUtils.js';

export function CandyHoldButton({ onLogged }) {
  const [holding, setHolding] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [capped, setCapped] = useState(false);
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
      setCapped(false);
      onLogged(durationMs);
    },
    [onLogged, stopLoop]
  );

  const tick = useCallback(() => {
    const delta = Date.now() - startRef.current;
    if (delta >= MAX_HOLD_MS) {
      setElapsedMs(MAX_HOLD_MS);
      setCapped(true);
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
    setCapped(false);
    rafRef.current = requestAnimationFrame(tick);
  }

  function handleRelease() {
    if (!holding || submittedRef.current) return;
    submittedRef.current = true;
    const durationMs = Math.min(Date.now() - startRef.current, MAX_HOLD_MS);
    finish(durationMs);
  }

  function handleCancel() {
    if (submittedRef.current) return;
    stopLoop();
    setHolding(false);
    setElapsedMs(0);
    setCapped(false);
  }

  useEffect(() => stopLoop, [stopLoop]);

  return (
    <div className="candy-hold-wrap">
      <button
        type="button"
        className={`candy-hold-btn${holding ? ' is-holding' : ''}${capped ? ' is-capped' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerUp={handleRelease}
        onPointerLeave={handleCancel}
        onPointerCancel={handleCancel}
      >
        <span className="candy-hold-btn-label">
          {holding ? formatDuration(elapsedMs) : 'Segure ao comer um doce'}
        </span>
      </button>
      <p className="candy-hold-hint">
        Segure enquanto come — quanto mais tempo, mais pesou o deslize (máx. {formatDuration(MAX_HOLD_MS)}).
      </p>
    </div>
  );
}
