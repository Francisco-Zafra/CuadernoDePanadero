import { useEffect, useState } from 'react';

/**
 * Keeps the screen on while `enabled`. Re-acquires the lock when the page becomes
 * visible again. Any failure is ignored (unsupported browser, low battery…).
 */
export function useWakeLock(enabled: boolean): { supported: boolean } {
  const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!enabled || !supported) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;

    const acquire = async () => {
      try {
        const l = await navigator.wakeLock.request('screen');
        if (cancelled) {
          void l.release().catch(() => undefined);
          return;
        }
        lock = l;
        setTick((t) => t + 1);
      } catch {
        // ignore
      }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') void acquire();
    };

    void acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      void lock?.release().catch(() => undefined);
    };
  }, [enabled, supported]);

  return { supported };
}
