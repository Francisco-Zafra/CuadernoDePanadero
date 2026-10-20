// Pure aggregations for the stats page.

import { prefermentName } from './defaults';
import type { Bake, BakeType } from './types';

export type Period = 'year' | 'all';

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export function inPeriod(bakes: Bake[], period: Period, now = new Date()): Bake[] {
  if (period === 'all') return bakes;
  const from = new Date(now);
  from.setFullYear(from.getFullYear() - 1);
  return bakes.filter((b) => b.date >= from && b.date <= now);
}

/** Bakes with a real recipe (quick notes are excluded from recipe stats). */
const complete = (bakes: Bake[]) => bakes.filter((b) => b.status === 'complete');

/** Rated bakes in chronological order. */
export function rated(bakes: Bake[]): (Bake & { rating: number })[] {
  return bakes
    .filter((b): b is Bake & { rating: number } => b.rating != null)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export interface Summary {
  count: number;
  bread: number;
  pizza: number;
  avgRating: number | null;
  lastFiveAvg: number | null;
  best: { rating: number; name: string; id: string } | null;
  avgHydration: number | null;
  avgHydrationByType: Record<BakeType, number | null>;
}

export function summarize(bakes: Bake[]): Summary {
  const r = rated(bakes);
  const best = r.reduce<Summary['best']>(
    (acc, b) =>
      !acc || b.rating > acc.rating ? { rating: b.rating, name: b.name, id: b.id } : acc,
    null,
  );
  const c = complete(bakes);
  const hyd = (t?: BakeType) =>
    mean(c.filter((b) => !t || b.type === t).map((b) => b.recipe.hydration));
  return {
    count: bakes.length,
    bread: bakes.filter((b) => b.type === 'bread').length,
    pizza: bakes.filter((b) => b.type === 'pizza').length,
    avgRating: mean(r.map((b) => b.rating)),
    lastFiveAvg: r.length >= 5 ? mean(r.slice(-5).map((b) => b.rating)) : null,
    best,
    avgHydration: hyd(),
    avgHydrationByType: { bread: hyd('bread'), pizza: hyd('pizza') },
  };
}

export interface EvolutionPoint {
  date: Date;
  rating: number;
  /** Mean of this and the two previous ratings. */
  avg: number;
}

export function evolution(bakes: Bake[]): EvolutionPoint[] {
  const r = rated(bakes);
  return r.map((b, i) => {
    const w = r.slice(Math.max(0, i - 2), i + 1);
    return { date: b.date, rating: b.rating, avg: w.reduce((s, x) => s + x.rating, 0) / w.length };
  });
}

/** Mean of the first and last five ratings (null with fewer than ten). */
export function firstVsLast(bakes: Bake[]): { first: number; last: number } | null {
  const r = rated(bakes);
  if (r.length < 10) return null;
  return {
    first: mean(r.slice(0, 5).map((b) => b.rating))!,
    last: mean(r.slice(-5).map((b) => b.rating))!,
  };
}

export interface HydrationPoint {
  id: string;
  hydration: number;
  rating: number;
  type: BakeType;
}

export function byHydration(bakes: Bake[]): HydrationPoint[] {
  return rated(complete(bakes)).map((b) => ({
    id: b.id,
    hydration: b.recipe.hydration,
    rating: b.rating,
    type: b.type,
  }));
}

export interface PrefermentGroup {
  key: string;
  name: string;
  ratings: number[];
  mean: number;
}

export function byPreferment(bakes: Bake[]): PrefermentGroup[] {
  const groups = new Map<string, { name: string; ratings: number[] }>();
  for (const b of rated(complete(bakes))) {
    const p = b.recipe.preferment;
    const key = p.kind === 'custom' ? `custom:${p.customId ?? p.name ?? ''}` : p.kind;
    const g = groups.get(key) ?? { name: prefermentName(p), ratings: [] };
    g.ratings.push(b.rating);
    groups.set(key, g);
  }
  return [...groups.entries()]
    .map(([key, g]) => ({ key, name: g.name, ratings: g.ratings, mean: mean(g.ratings)! }))
    .sort((a, b) => b.mean - a.mean);
}

export interface MonthCount {
  year: number;
  month: number;
  count: number;
}

/** Bakes in each of the last 12 months, oldest first, ending with the current month. */
export function perMonth(bakes: Bake[], now = new Date()): MonthCount[] {
  const months: MonthCount[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth(), count: 0 });
  }
  for (const b of bakes) {
    const m = months.find((x) => x.year === b.date.getFullYear() && x.month === b.date.getMonth());
    if (m) m.count++;
  }
  return months;
}
