import { describe, expect, it } from 'vitest';
import { DEFAULT_PREFERMENTS, blankBake, prefermentFrom } from './defaults';
import { byPreferment, evolution, firstVsLast, inPeriod, perMonth, summarize } from './stats';
import type { Bake, BakeType, Preferment } from './types';

let n = 0;
const bake = (o: {
  date: Date;
  rating?: number | null;
  type?: BakeType;
  hyd?: number;
  pref?: Preferment;
  status?: Bake['status'];
}): Bake => {
  const b = blankBake(o.type ?? 'bread');
  return {
    ...b,
    id: `b${++n}`,
    name: `Bake ${n}`,
    date: o.date,
    rating: o.rating ?? null,
    status: o.status ?? 'complete',
    recipe: { ...b.recipe, hydration: o.hyd ?? 70, preferment: o.pref ?? b.recipe.preferment },
    createdAt: o.date,
    updatedAt: o.date,
  };
};

const now = new Date(2026, 9, 20);
const d = (y: number, m: number, day = 10) => new Date(y, m, day);

describe('stats', () => {
  it('summarizes counts, ratings and hydration', () => {
    const list = [
      bake({ date: d(2026, 1), rating: 3, hyd: 70 }),
      bake({ date: d(2026, 2), rating: 4.5, type: 'pizza', hyd: 62 }),
      bake({ date: d(2026, 3), rating: null, hyd: 80 }),
      bake({ date: d(2026, 4), hyd: 99, status: 'incomplete' }),
    ];
    const s = summarize(list);
    expect(s.count).toBe(4);
    expect(s.bread).toBe(3);
    expect(s.pizza).toBe(1);
    expect(s.avgRating).toBeCloseTo(3.75);
    expect(s.lastFiveAvg).toBeNull();
    expect(s.best?.rating).toBe(4.5);
    // Incomplete quick notes do not count for hydration.
    expect(s.avgHydrationByType.bread).toBeCloseTo(75);
    expect(s.avgHydrationByType.pizza).toBeCloseTo(62);
  });

  it('filters the last year', () => {
    const list = [bake({ date: d(2025, 5) }), bake({ date: d(2026, 5) })];
    expect(inPeriod(list, 'year', now)).toHaveLength(1);
    expect(inPeriod(list, 'all', now)).toHaveLength(2);
  });

  it('computes a 3-bake moving average in date order', () => {
    const list = [
      bake({ date: d(2026, 3), rating: 5 }),
      bake({ date: d(2026, 1), rating: 2 }),
      bake({ date: d(2026, 2), rating: 3 }),
    ];
    const e = evolution(list);
    expect(e.map((p) => p.rating)).toEqual([2, 3, 5]);
    expect(e.map((p) => p.avg)).toEqual([2, 2.5, 10 / 3]);
  });

  it('compares the first and last five only with ten ratings', () => {
    const list = Array.from({ length: 10 }, (_, i) =>
      bake({ date: d(2026, 0, i + 1), rating: i < 5 ? 3 : 5 }),
    );
    expect(firstVsLast(list)).toEqual({ first: 3, last: 5 });
    expect(firstVsLast(list.slice(1))).toBeNull();
  });

  it('groups ratings by preferment, best mean first', () => {
    const biga = prefermentFrom(DEFAULT_PREFERMENTS.biga);
    const list = [
      bake({ date: d(2026, 1), rating: 3 }),
      bake({ date: d(2026, 2), rating: 4, pref: biga }),
      bake({ date: d(2026, 3), rating: 5, pref: biga }),
    ];
    const g = byPreferment(list);
    expect(g.map((x) => x.key)).toEqual(['biga', 'none']);
    expect(g[0]!.mean).toBe(4.5);
  });

  it('counts bakes in the last 12 months', () => {
    const list = [
      bake({ date: d(2026, 9) }),
      bake({ date: d(2026, 9, 2) }),
      bake({ date: d(2025, 10) }),
      bake({ date: d(2025, 9) }),
    ];
    const m = perMonth(list, now);
    expect(m).toHaveLength(12);
    expect(m[0]).toMatchObject({ year: 2025, month: 10, count: 1 });
    expect(m[11]).toMatchObject({ year: 2026, month: 9, count: 2 });
  });
});
