import { describe, expect, it } from 'vitest';
import { DEFAULT_PREFERMENTS, NO_PREFERMENT, prefermentFrom } from '../domain/defaults';
import type { Recipe } from '../domain/types';
import { weighRows } from './recipeBlocks';

const base = (over: Partial<Recipe> = {}): Recipe => ({
  pieces: 1,
  pieceWeight: 1000,
  flours: [{ name: '', pct: 100 }],
  hydration: 70,
  salt: 2,
  yeast: { kind: 'none', pct: 0 },
  extras: [],
  preferment: { ...NO_PREFERMENT },
  ...over,
});

describe('weighRows', () => {
  it('puts preferment and final grams of the same ingredient on one row', () => {
    const rows = weighRows(base({ preferment: prefermentFrom(DEFAULT_PREFERMENTS.biga) }));
    expect(rows.map((r) => r.key)).toEqual(['flour-0', 'water', 'salt', 'yeast', 'pref']);
    const [flour, water, salt, yeast, pref] = rows;
    expect(flour?.pref && flour.final).toBeTruthy();
    expect(water?.pref && water.final).toBeTruthy();
    expect(salt?.pref).toBeNull();
    expect(yeast?.pref).not.toBeNull();
    expect(yeast?.final).toBeNull();
    expect(pref?.isPreferment).toBe(true);
  });

  it('keeps the preferment flour on its own row when there are several flours', () => {
    const rows = weighRows(
      base({
        flours: [
          { name: 'Blanca', pct: 80 },
          { name: 'Integral', pct: 20 },
        ],
        preferment: prefermentFrom(DEFAULT_PREFERMENTS.poolish),
      }),
    );
    expect(rows.slice(0, 3).map((r) => [r.key, !!r.pref, !!r.final])).toEqual([
      ['flour-pref', true, false],
      ['flour-0', false, true],
      ['flour-1', false, true],
    ]);
  });

  it('has only final grams without a preferment', () => {
    const rows = weighRows(base());
    expect(rows.every((r) => r.pref === null)).toBe(true);
  });
});
