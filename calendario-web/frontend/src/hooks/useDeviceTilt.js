import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Motion } from '@capacitor/motion';

// Só existe sensor de inclinação de verdade no app Android nativo — no
// navegador (dev, PWA) e num eventual build iOS futuro (que exigiria o fluxo
// de permissão de gesto do DeviceOrientationEvent) o recurso fica desligado:
// ângulo travado em 0, gravidade reta pra baixo, sem custo nenhum.
const MAX_GRAVITY_TILT_DEG = 30; // clamp — acima disso a gravidade "de lado" foge do visual raso do prato
const SMOOTHING_ALPHA = 0.15; // média móvel exponencial — tira o jitter do sensor
const WAKE_THRESHOLD_DEG = 4; // variação acumulada mínima pra acordar bolinhas já assentadas

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function useDeviceTilt() {
  const gravityAngleRef = useRef(0);
  const [wakeSignal, setWakeSignal] = useState(0);

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return;

    let handle;
    let cancelled = false;
    let lastWakeAngle = 0;

    Motion.addListener('orientation', (event) => {
      const target = clamp(event.gamma || 0, -MAX_GRAVITY_TILT_DEG, MAX_GRAVITY_TILT_DEG);
      gravityAngleRef.current += (target - gravityAngleRef.current) * SMOOTHING_ALPHA;

      if (Math.abs(gravityAngleRef.current - lastWakeAngle) > WAKE_THRESHOLD_DEG) {
        lastWakeAngle = gravityAngleRef.current;
        setWakeSignal((n) => n + 1);
      }
    })
      .then((h) => {
        if (cancelled) h.remove();
        else handle = h;
      })
      .catch((err) => console.error('Falha ao iniciar sensor de inclinação:', err.message));

    return () => {
      cancelled = true;
      handle?.remove();
    };
  }, []);

  return { gravityAngleRef, wakeSignal };
}
