import { useCallback, useEffect, useRef, useState } from 'react';
import { ServiceError } from './api';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: ServiceError | null;
  reload: () => void;
  setData: (next: T | ((prev: T | null) => T)) => void;
}

/**
 * Hook simples para carregar um recurso e expor loading/error/reload.
 * O `fetcher` deve ser estável (use useCallback no caller, ou passe um valor
 * primitivo nas deps para que esta função possa decidir quando refetch).
 */
export function useAsync<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ServiceError | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const [ticker, setTicker] = useState(0);
  const reload = useCallback(() => setTicker((t) => t + 1), []);

  useEffect(() => {
    let ativo = true;
    setLoading(true);
    setError(null);
    fetcherRef.current()
      .then((value) => { if (ativo) setData(value); })
      .catch((e: unknown) => {
        if (!ativo) return;
        setError(e instanceof ServiceError ? e : new ServiceError(String(e), 0));
      })
      .finally(() => { if (ativo) setLoading(false); });
    return () => { ativo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, ticker]);

  const updater = useCallback(
    (next: T | ((prev: T | null) => T)) => {
      setData((prev) => (typeof next === 'function'
        ? (next as (p: T | null) => T)(prev)
        : next));
    },
    [],
  );

  return { data, loading, error, reload, setData: updater };
}
