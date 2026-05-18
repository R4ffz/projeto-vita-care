import { useEffect, useState } from 'react';

/**
 * Força re-render do componente em intervalos regulares.
 * Útil para manter strings relativas ("há 30s") atualizadas sem
 * precisar de prop drilling.
 */
export function useTickInterval(intervalMs: number): void {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}
