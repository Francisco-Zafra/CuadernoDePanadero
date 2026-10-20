import { describe, expect, it } from 'vitest';
import { convertYeast, fromFresh, toFresh } from './yeast';

describe('yeast conversion', () => {
  it('uses fresh yeast as the reference', () => {
    expect(fromFresh(3, 'instant')).toBeCloseTo(1, 12);
    expect(fromFresh(10, 'active_dry')).toBeCloseTo(4, 12);
    expect(fromFresh(7, 'fresh')).toBe(7);
  });

  it('converts back to fresh', () => {
    expect(toFresh(1, 'instant')).toBeCloseTo(3, 12);
    expect(toFresh(4, 'active_dry')).toBeCloseTo(10, 12);
  });

  it('converts between dry kinds through fresh', () => {
    // 1 g instant = 3 g fresh = 1.2 g active dry
    expect(convertYeast(1, 'instant', 'active_dry')).toBeCloseTo(1.2, 12);
    expect(convertYeast(1.2, 'active_dry', 'instant')).toBeCloseTo(1, 12);
    expect(convertYeast(0.9, 'fresh', 'instant')).toBeCloseTo(0.3, 12);
  });

  it('round-trips without drift', () => {
    const v = convertYeast(convertYeast(2.5, 'fresh', 'active_dry'), 'active_dry', 'fresh');
    expect(v).toBeCloseTo(2.5, 12);
  });

  it('leaves values alone for the same kind or "none"', () => {
    expect(convertYeast(2, 'instant', 'instant')).toBe(2);
    expect(convertYeast(2, 'none', 'fresh')).toBe(2);
    expect(convertYeast(2, 'fresh', 'none')).toBe(2);
  });
});
