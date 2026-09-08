import { useCallback, useEffect, useRef } from 'react';

export interface UseAbortController {
  signal: AbortSignal | null;
  abort: () => void;
  startNew: () => AbortSignal;
}

export function useAbortController(): UseAbortController {
  const ref = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      ref.current?.abort();
    };
  }, []);

  const abort = useCallback(() => {
    ref.current?.abort();
    ref.current = null;
  }, []);

  const startNew = useCallback(() => {
    ref.current?.abort();
    const ctrl = new AbortController();
    ref.current = ctrl;
    return ctrl.signal;
  }, []);

  return { signal: ref.current?.signal ?? null, abort, startNew };
}
