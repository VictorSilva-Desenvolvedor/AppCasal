import { useEffect, useRef, useState } from 'react';

// Física da jarra de emoções, na mão (sem biblioteca externa — mesmo espírito
// de useDragAndDrop.js). Bolhas são círculos; colisão é círculo-círculo; os
// limites são o retângulo do contêiner (o afunilamento visual da jarra é só
// CSS/overflow:hidden, a física nunca precisa saber disso).
const GRAVITY = 1800; // px/s²
const WALL_RESTITUTION = 0.4; // quique ao bater na parede/piso da jarra
const COLLISION_DAMPING = 0.85; // perda de energia ao esbarrar em outra bolha (sem quique bolha-bolha)
const AIR_DAMPING = 0.995; // atrito do ar, evita deslizar lateralmente pra sempre
const REST_SPEED = 14; // px/s abaixo disso conta como "parada"
const REST_FRAMES_TO_SETTLE = 15; // frames consecutivos parada antes de travar de vez
const STEP_DT = 1 / 60;
const INSTANT_SETTLE_STEPS = 240; // ~4s simulados — avanço instantâneo no carregamento inicial
const MAX_REALTIME_FRAMES = 600; // trava de segurança: força repouso após ~10s reais

// Pequena variação de comportamento por categoria (seção 5 do documento:
// "ansioso: movimento mais instável" vs. "calmo: esfera suave") — só ajusta
// constantes já existentes do laço de integração, sem mudar a colisão.
const CATEGORY_TUNING = {
  positiva: { extraDamping: 0.965, jitterAccel: 0 },
  neutra: { extraDamping: 1, jitterAccel: 0 },
  dificil: { extraDamping: 1, jitterAccel: 260 }, // px/s² de sacudida lateral enquanto cai
};
const DEFAULT_TUNING = CATEGORY_TUNING.neutra;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function radiusForIntensity(intensity) {
  return 5 + intensity * 3; // raio -> diâmetro 16/22/28/34/40px (intensidade 1–5)
}

function createBlob(entry, bounds) {
  const r = radiusForIntensity(entry.intensity);
  const margin = r + 4;
  const spread = Math.max(bounds.width - margin * 2, 1);
  return {
    id: entry._id,
    x: clamp(margin + Math.random() * spread, margin, bounds.width - margin),
    y: -r * 2 - Math.random() * 60,
    vx: (Math.random() - 0.5) * 40,
    vy: 0,
    r,
    color: entry.color,
    category: entry.category || 'neutra',
    resting: false,
    restFrames: 0,
  };
}

function resolveBlobCollision(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
  const minDist = a.r + b.r;
  if (dist >= minDist) return;

  const nx = dx / dist;
  const ny = dy / dist;
  const overlap = minDist - dist;
  const aFree = !a.resting;
  const bFree = !b.resting;

  if (aFree && bFree) {
    a.x -= nx * overlap * 0.5;
    a.y -= ny * overlap * 0.5;
    b.x += nx * overlap * 0.5;
    b.y += ny * overlap * 0.5;
  } else if (aFree) {
    a.x -= nx * overlap;
    a.y -= ny * overlap;
  } else if (bFree) {
    b.x += nx * overlap;
    b.y += ny * overlap;
  }

  const relNormal = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
  if (relNormal >= 0) return; // já se afastando

  if (aFree && bFree) {
    a.vx += relNormal * nx * 0.5 * COLLISION_DAMPING;
    a.vy += relNormal * ny * 0.5 * COLLISION_DAMPING;
    b.vx -= relNormal * nx * 0.5 * COLLISION_DAMPING;
    b.vy -= relNormal * ny * 0.5 * COLLISION_DAMPING;
  } else if (aFree) {
    a.vx += relNormal * nx * COLLISION_DAMPING;
    a.vy += relNormal * ny * COLLISION_DAMPING;
  } else if (bFree) {
    b.vx -= relNormal * nx * COLLISION_DAMPING;
    b.vy -= relNormal * ny * COLLISION_DAMPING;
  }
}

function stepPhysics(blobs, dt, bounds) {
  blobs.forEach((b) => {
    if (b.resting) return;

    const tuning = CATEGORY_TUNING[b.category] || DEFAULT_TUNING;

    b.vy += GRAVITY * dt;
    if (tuning.jitterAccel) {
      b.vx += (Math.random() - 0.5) * tuning.jitterAccel * dt;
    }
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.vx *= AIR_DAMPING * tuning.extraDamping;

    if (b.x - b.r < 0) {
      b.x = b.r;
      b.vx = Math.abs(b.vx) * WALL_RESTITUTION;
    } else if (b.x + b.r > bounds.width) {
      b.x = bounds.width - b.r;
      b.vx = -Math.abs(b.vx) * WALL_RESTITUTION;
    }

    if (b.y + b.r > bounds.height) {
      b.y = bounds.height - b.r;
      b.vy = -Math.abs(b.vy) * WALL_RESTITUTION;
    }
  });

  for (let i = 0; i < blobs.length; i++) {
    for (let j = i + 1; j < blobs.length; j++) {
      resolveBlobCollision(blobs[i], blobs[j]);
    }
  }

  blobs.forEach((b) => {
    if (b.resting) return;
    const speed = Math.hypot(b.vx, b.vy);
    if (speed < REST_SPEED) {
      b.restFrames += 1;
      if (b.restFrames > REST_FRAMES_TO_SETTLE) {
        b.resting = true;
        b.vx = 0;
        b.vy = 0;
      }
    } else {
      b.restFrames = 0;
    }
  });

  return blobs;
}

const UNSET_RESET_KEY = Symbol('unset');

export function useEmotionJarPhysics(entries, containerRef, resetKey) {
  const [blobs, setBlobs] = useState([]);
  const blobsRef = useRef([]);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);
  const frameCountRef = useRef(0);
  const lastResetKeyRef = useRef(UNSET_RESET_KEY);

  function getBounds() {
    const el = containerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return { width: rect.width, height: rect.height };
  }

  function publish() {
    setBlobs(blobsRef.current.map((b) => ({ ...b })));
  }

  function runRealtimeLoop() {
    if (rafRef.current != null) return;
    lastTimeRef.current = null;
    frameCountRef.current = 0;

    function frame(time) {
      const bounds = getBounds();
      if (!bounds) {
        rafRef.current = requestAnimationFrame(frame);
        return;
      }
      if (lastTimeRef.current == null) lastTimeRef.current = time;
      const dt = Math.min((time - lastTimeRef.current) / 1000, 1 / 30);
      lastTimeRef.current = time;
      frameCountRef.current += 1;

      if (frameCountRef.current > MAX_REALTIME_FRAMES) {
        blobsRef.current.forEach((b) => {
          b.resting = true;
          b.vx = 0;
          b.vy = 0;
        });
        publish();
        rafRef.current = null;
        return;
      }

      stepPhysics(blobsRef.current, dt, bounds);
      publish();

      if (blobsRef.current.some((b) => !b.resting)) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        rafRef.current = null;
      }
    }

    rafRef.current = requestAnimationFrame(frame);
  }

  useEffect(() => {
    const bounds = getBounds();
    if (!bounds) return;

    const isDatasetReset = resetKey !== lastResetKeyRef.current;
    lastResetKeyRef.current = resetKey;

    if (isDatasetReset) {
      // Montagem inicial ou troca "Meu"/parceiro: o conjunto de dados inteiro
      // é novo pra esta jarra — recria tudo do zero e avança a física
      // instantaneamente, sem reproduzir a queda do dia inteiro na tela.
      blobsRef.current = entries.map((entry) => createBlob(entry, bounds));
      for (let i = 0; i < INSTANT_SETTLE_STEPS; i++) {
        stepPhysics(blobsRef.current, STEP_DT, bounds);
      }
      publish();
      return;
    }

    const currentIds = new Set(entries.map((e) => e._id));
    blobsRef.current = blobsRef.current.filter((b) => currentIds.has(b.id));

    const existingIds = new Set(blobsRef.current.map((b) => b.id));
    const newEntries = entries.filter((e) => !existingIds.has(e._id));

    if (!newEntries.length) {
      publish();
      return;
    }

    // Registro novo dentro do mesmo dataset (mesmo "Meu"/parceiro de antes):
    // sempre cai animado, mesmo que a jarra estivesse vazia até agora.
    newEntries.forEach((entry) => blobsRef.current.push(createBlob(entry, bounds)));
    publish();
    runRealtimeLoop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, resetKey]);

  useEffect(
    () => () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  return { blobs };
}
