import type { Bake } from '../domain/types';
import { useBakes } from './useBakes';

/** A bake from the shared listener (no extra reads). */
export function useBake(id: string | undefined): { bake: Bake | null; loading: boolean } {
  const { bakes, loading } = useBakes();
  const bake = id ? (bakes.find((b) => b.id === id) ?? null) : null;
  return { bake, loading };
}
