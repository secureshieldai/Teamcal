/**
 * Minimal data-fetching hook. Runs `fetcher` on mount (and when `deps` change),
 * returns { data, loading, error, refetch }.
 * Keeps the caller-provided initial state visible while the request is in flight.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

interface QueryState<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

export function useApiQuery<T>(
  fetcher: () => Promise<T>,
  initialData: T,
  deps: unknown[] = []
) {
  const [state, setState] = useState<QueryState<T>>({
    data: initialData,
    loading: true,
    error: null,
  });

  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const run = useCallback(async () => {
    setState((prev) => ({ ...prev, error: null }));
    try {
      const result = await fetcher();
      if (mounted.current) setState({ data: result, loading: false, error: null });
    } catch (err) {
      if (mounted.current)
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
    const timer = setInterval(run, 15_000);
    return () => clearInterval(timer);
  }, [run]);

  return { ...state, refetch: run };
}
