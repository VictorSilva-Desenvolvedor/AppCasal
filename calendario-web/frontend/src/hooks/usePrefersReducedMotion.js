import { useEffect, useState } from 'react';

// A jarra é a parte mais animada do app (queda, colisão, sacudida, pulo). Quem
// liga "reduzir movimento" no sistema normalmente faz isso por enjoo/vertigem —
// aqui a preferência desliga a simulação em tempo real, não só as transições
// CSS: as bolinhas aparecem direto na posição de repouso.
const QUERY = '(prefers-reduced-motion: reduce)';

export function usePrefersReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.(QUERY).matches === true
  );

  useEffect(() => {
    const mql = window.matchMedia?.(QUERY);
    if (!mql) return undefined;

    function handleChange(event) {
      setPrefersReduced(event.matches);
    }

    setPrefersReduced(mql.matches);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  return prefersReduced;
}
