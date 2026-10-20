import { describe, expect, it } from 'vitest';
import { computeDough, roundGrams, sumGrams, totalFlourFor, type Line } from './bakersMath';
import { DEFAULT_PREFERMENTS, NO_PREFERMENT, prefermentFrom } from './defaults';
import type { Recipe } from './types';

const base = (over: Partial<Recipe> = {}): Recipe => ({
  pieces: 1,
  pieceWeight: 1000,
  flours: [{ name: 'Harina', pct: 100 }],
  hydration: 70,
  salt: 2,
  yeast: { kind: 'fresh', pct: 1 },
  extras: [],
  preferment: { ...NO_PREFERMENT },
  ...over,
});

const all = (r: ReturnType<typeof computeDough>): Line[] => r.final;
const byKind = (lines: Line[], kind: Line['kind']) => lines.filter((l) => l.kind === kind);
const grams = (lines: Line[], kind: Line['kind']) => sumGrams(byKind(lines, kind));

describe('computeDough', () => {
  it('adds up exactly to the target dough weight', () => {
    const recipes: Recipe[] = [
      base(),
      base({ pieces: 4, pieceWeight: 250, extras: [{ name: 'Aceite', pct: 3 }] }),
      base({ preferment: prefermentFrom(DEFAULT_PREFERMENTS.poolish) }),
      base({ preferment: prefermentFrom(DEFAULT_PREFERMENTS.biga), hydration: 65 }),
      base({
        preferment: prefermentFrom(DEFAULT_PREFERMENTS.sourdough),
        yeast: { kind: 'none', pct: 0 },
      }),
    ];
    for (const r of recipes) {
      const res = computeDough(r);
      // The final block contains the whole preferment, so it is the full dough.
      expect(sumGrams(res.final)).toBeCloseTo(r.pieces * r.pieceWeight, 9);
      expect(res.totals.dough).toBe(r.pieces * r.pieceWeight);
    }
  });

  it('computes a straight dough as a single block', () => {
    const res = computeDough(base());
    expect(res.preferment).toBeNull();
    // F = 1000 / 1.73
    const F = 1000 / 1.73;
    expect(res.totalFlour).toBeCloseTo(F, 9);
    expect(grams(all(res), 'flour')).toBeCloseTo(F, 9);
    expect(grams(all(res), 'water')).toBeCloseTo(F * 0.7, 9);
    expect(grams(all(res), 'salt')).toBeCloseTo(F * 0.02, 9);
    expect(grams(all(res), 'yeast')).toBeCloseTo(F * 0.01, 9);
    expect(byKind(all(res), 'preferment')).toHaveLength(0);
    expect(res.warnings).toEqual([]);
  });

  it('splits a poolish into its own block', () => {
    const r = base({
      hydration: 75,
      yeast: { kind: 'instant', pct: 0.2 },
      preferment: prefermentFrom(DEFAULT_PREFERMENTS.poolish),
    });
    const res = computeDough(r);
    // pref yeast over total = 30 × 0.1 / 100 = 0.03 %
    const F = 1000 / (1 + (75 + 2 + 0.2 + 0.03) / 100);
    expect(res.totalFlour).toBeCloseTo(F, 9);
    const pref = res.preferment!;
    const Fp = F * 0.3;
    expect(grams(pref, 'flour')).toBeCloseTo(Fp, 9);
    expect(grams(pref, 'water')).toBeCloseTo(Fp, 9);
    expect(grams(pref, 'yeast')).toBeCloseTo(Fp * 0.001, 9);
    expect(grams(res.final, 'flour')).toBeCloseTo(F - Fp, 9);
    expect(grams(res.final, 'water')).toBeCloseTo(F * 0.75 - Fp, 9);
    expect(grams(res.final, 'preferment')).toBeCloseTo(Fp * 2.001, 9);
    expect(res.totals.preferment).toBeCloseTo(Fp * 2.001, 9);
  });

  it('handles a biga (low hydration, 1 % yeast)', () => {
    const r = base({
      hydration: 65,
      salt: 3,
      yeast: { kind: 'fresh', pct: 0 },
      preferment: prefermentFrom(DEFAULT_PREFERMENTS.biga),
    });
    const res = computeDough(r);
    const F = 1000 / (1 + (65 + 3 + 0 + 0.5) / 100);
    const Fp = F * 0.5;
    expect(grams(res.preferment!, 'water')).toBeCloseTo(Fp * 0.5, 9);
    expect(grams(res.preferment!, 'yeast')).toBeCloseTo(Fp * 0.01, 9);
    expect(grams(res.final, 'water')).toBeCloseTo(F * 0.65 - Fp * 0.5, 9);
    // No final yeast line when its % is 0.
    expect(byKind(res.final, 'yeast')).toHaveLength(0);
    expect(res.warnings).toEqual([]);
  });

  it('treats sourdough as flour + water with no yeast', () => {
    const r = base({
      hydration: 75,
      yeast: { kind: 'none', pct: 5 },
      preferment: prefermentFrom(DEFAULT_PREFERMENTS.sourdough),
    });
    const res = computeDough(r);
    // yeast kind 'none' ignores its %; sourdough has yeastPct 0.
    const F = 1000 / (1 + (75 + 2) / 100);
    expect(res.totalFlour).toBeCloseTo(F, 9);
    expect(res.preferment!.map((l) => l.kind)).toEqual(['flour', 'water']);
    expect(grams(res.preferment!, 'flour')).toBeCloseTo(F * 0.2, 9);
    expect(byKind(res.final, 'yeast')).toHaveLength(0);
  });

  it('labels a seeded sourdough as starter', () => {
    const pref = { ...prefermentFrom(DEFAULT_PREFERMENTS.sourdough), yeastPct: 20 };
    const res = computeDough(base({ yeast: { kind: 'none', pct: 0 }, preferment: pref }));
    expect(byKind(res.preferment!, 'starter')).toHaveLength(1);
    expect(sumGrams(res.final)).toBeCloseTo(1000, 9);
  });

  it('supports custom preferments', () => {
    const pref = prefermentFrom({
      id: 'abc',
      name: 'Pâte fermentée',
      flourPct: 20,
      hydration: 65,
      yeastPct: 0.5,
      hours: 14,
      tempC: 20,
    });
    expect(pref.kind).toBe('custom');
    expect(pref.customId).toBe('abc');
    const res = computeDough(base({ preferment: pref }));
    const F = 1000 / (1 + (70 + 2 + 1 + 0.1) / 100);
    expect(res.totalFlour).toBeCloseTo(F, 9);
    expect(grams(res.preferment!, 'water')).toBeCloseTo(F * 0.2 * 0.65, 9);
    expect(sumGrams(res.final)).toBeCloseTo(1000, 9);
  });

  it('warns (and does not correct) when the preferment brings more water than the total', () => {
    const pref = { ...prefermentFrom(DEFAULT_PREFERMENTS.poolish), flourPct: 80, hydration: 100 };
    const res = computeDough(base({ hydration: 60, preferment: pref }));
    expect(res.warnings).toContain('negativeFinalWater');
    const water = grams(res.final, 'water');
    expect(water).toBeLessThan(0);
    expect(water).toBeCloseTo(res.totalFlour * 0.6 - res.totalFlour * 0.8, 9);
    expect(sumGrams(res.final)).toBeCloseTo(1000, 9);
  });

  it('distributes the final flour across a flour mix', () => {
    const r = base({
      flours: [
        { name: 'Panificable', pct: 80 },
        { name: 'Integral', pct: 20 },
      ],
      preferment: prefermentFrom(DEFAULT_PREFERMENTS.poolish),
    });
    const res = computeDough(r);
    const F = res.totalFlour;
    const finalFlour = F - F * 0.3;
    const [a, b] = byKind(res.final, 'flour');
    expect(a!.name).toBe('Panificable');
    expect(a!.grams).toBeCloseTo(finalFlour * 0.8, 9);
    expect(b!.grams).toBeCloseTo(finalFlour * 0.2, 9);
    // With a mix, the preferment flour has no single name.
    expect(res.preferment![0]!.name).toBeUndefined();
    expect(res.warnings).toEqual([]);
  });

  it('warns when the flour mix does not add up to 100 %', () => {
    const res = computeDough(
      base({
        flours: [
          { name: 'A', pct: 70 },
          { name: 'B', pct: 20 },
        ],
      }),
    );
    expect(res.warnings).toContain('floursNot100');
    expect(sumGrams(res.final)).toBeCloseTo(1000, 9);
  });

  it('includes extras in the flour calculation', () => {
    const r = base({
      extras: [
        { name: 'Aceite', pct: 3 },
        { name: 'Azúcar', pct: 2 },
      ],
    });
    expect(totalFlourFor(r)).toBeCloseTo(1000 / 1.78, 9);
    const res = computeDough(r);
    expect(grams(res.final, 'extra')).toBeCloseTo((1000 / 1.78) * 0.05, 9);
  });

  it('returns zero flour for an empty dough', () => {
    const res = computeDough(base({ pieces: 0 }));
    expect(res.totalFlour).toBe(0);
    expect(sumGrams(res.final)).toBe(0);
  });
});

describe('roundGrams', () => {
  it('rounds to whole grams from 10 g up', () => {
    expect(roundGrams(578.03)).toBe(578);
    expect(roundGrams(10.4)).toBe(10);
    expect(roundGrams(10.5)).toBe(11);
  });

  it('keeps one decimal below 10 g', () => {
    expect(roundGrams(9.96)).toBe(10);
    expect(roundGrams(9.94)).toBe(9.9);
    expect(roundGrams(1.234)).toBe(1.2);
  });

  it('always keeps one decimal for yeast', () => {
    expect(roundGrams(12.34, 'yeast')).toBe(12.3);
    expect(roundGrams(0.17, 'yeast')).toBe(0.2);
  });

  it('does not round the underlying calculation', () => {
    const res = computeDough(base());
    const flour = res.final[0]!.grams;
    expect(Number.isInteger(flour)).toBe(false);
  });
});
