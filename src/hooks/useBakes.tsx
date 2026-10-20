import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { watchBakes } from '../data/bakesRepo';
import { errorMessage } from '../data/errors';
import type { Bake } from '../domain/types';
import { useUid } from './useAuth';

interface BakesState {
  bakes: Bake[];
  loading: boolean;
  error: string | null;
}

const BakesContext = createContext<BakesState | null>(null);

/**
 * Single Firestore listener for all bakes, shared by the journal, the detail view
 * and the stats. Bake docs only carry a small thumbnail, never the photos.
 */
export function BakesProvider({ children }: { children: ReactNode }) {
  const uid = useUid();
  const [state, setState] = useState<BakesState>({ bakes: [], loading: true, error: null });

  useEffect(
    () =>
      watchBakes(
        uid,
        (bakes) => setState({ bakes, loading: false, error: null }),
        (err) => setState((s) => ({ ...s, loading: false, error: errorMessage(err) })),
      ),
    [uid],
  );

  return <BakesContext.Provider value={state}>{children}</BakesContext.Provider>;
}

export function useBakes(): BakesState {
  const ctx = useContext(BakesContext);
  if (!ctx) throw new Error('useBakes must be used inside <BakesProvider>');
  return ctx;
}
