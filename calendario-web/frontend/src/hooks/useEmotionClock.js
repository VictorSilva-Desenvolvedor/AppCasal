import { useEffect, useState } from 'react';
import { currentPeriod, toDayKey } from '../features/emocoes/emocoesUtils.js';

// A tela de emoções derivava o dia e o período uma única vez por render, então
// uma aba deixada aberta atravessava as 18h (ou a meia-noite) ainda mostrando a
// pergunta do período anterior e gravando no dayKey de ontem.
const TICK_MS = 30_000;

function readClock() {
  return { dayKey: toDayKey(new Date()), period: currentPeriod() };
}

export function useEmotionClock() {
  const [clock, setClock] = useState(readClock);

  useEffect(() => {
    const id = setInterval(() => {
      // Devolve o objeto anterior quando nada mudou: sem isso o setState de
      // cada tick re-renderizaria a página (e re-publicaria toda a física da
      // jarra) a cada 30s sem nenhuma mudança visível.
      setClock((prev) => {
        const next = readClock();
        return prev.dayKey === next.dayKey && prev.period === next.period ? prev : next;
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  return clock;
}
