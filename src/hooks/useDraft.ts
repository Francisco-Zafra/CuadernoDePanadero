import { useCallback, useEffect, useRef, useState } from 'react';

const PREFIX = 'draft:';

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/**
 * Editor state that is auto-saved to localStorage while editing.
 * `restored` tells whether the initial value came from a saved draft.
 */
export function useDraft<T>(
  key: string,
  initial: () => T,
  revive: (raw: T) => T = (x) => x,
  ignoreSaved = false,
) {
  const [restored] = useState(() => !ignoreSaved && read<T>(key) !== null);
  const [value, setValue] = useState<T>(() => {
    const saved = ignoreSaved ? null : read<T>(key);
    return saved !== null ? revive(saved) : initial();
  });
  const dirty = useRef(false);

  useEffect(() => {
    if (!dirty.current) return;
    const t = window.setTimeout(() => {
      try {
        localStorage.setItem(PREFIX + key, JSON.stringify(value));
      } catch {
        // Storage full or blocked: the draft is a convenience, ignore.
      }
    }, 400);
    return () => window.clearTimeout(t);
  }, [key, value]);

  const update = useCallback((next: T | ((prev: T) => T)) => {
    dirty.current = true;
    setValue(next);
  }, []);

  const clear = useCallback(() => {
    dirty.current = false;
    try {
      localStorage.removeItem(PREFIX + key);
    } catch {
      // ignore
    }
  }, [key]);

  const discard = useCallback(() => {
    clear();
    setValue(initial());
  }, [clear, initial]);

  return { value, update, clear, discard, restored };
}
