import { useCallback, useSyncExternalStore } from 'react';

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (cb: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Sidebar layout (desktop). */
export const DESKTOP_QUERY = '(min-width: 960px)';
/** Journal list + detail side by side. */
export const SPLIT_QUERY = '(min-width: 1200px)';
