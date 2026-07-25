import { useCallback, useState } from 'react';

export function usePendingIds() {
  const [pendingIds, setPendingIds] = useState(() => new Set());

  const run = useCallback(async (id, fn) => {
    setPendingIds((prev) => new Set(prev).add(id));
    try {
      return await fn();
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, []);

  const isPending = useCallback((id) => pendingIds.has(id), [pendingIds]);

  return { isPending, run };
}
