import { useCallback, useState } from 'react';

export type ThemePref = 'auto' | 'light' | 'dark';

function readTheme(): ThemePref {
  try {
    const t = localStorage.getItem('theme');
    return t === 'light' || t === 'dark' ? t : 'auto';
  } catch {
    return 'auto';
  }
}

/** Per-device theme preference. "auto" follows prefers-color-scheme. */
export function useTheme(): [ThemePref, (t: ThemePref) => void] {
  const [theme, setThemeState] = useState<ThemePref>(readTheme);
  const setTheme = useCallback((t: ThemePref) => {
    setThemeState(t);
    const root = document.documentElement;
    if (t === 'auto') delete root.dataset.theme;
    else root.dataset.theme = t;
    try {
      if (t === 'auto') localStorage.removeItem('theme');
      else localStorage.setItem('theme', t);
    } catch {
      // ignore
    }
  }, []);
  return [theme, setTheme];
}
