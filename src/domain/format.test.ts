import { describe, expect, it } from 'vitest';
import {
  formatDate,
  formatDateLong,
  formatDuration,
  formatGrams,
  formatNumber,
  formatRating,
  parseDecimal,
} from './format';

describe('format', () => {
  it('uses a decimal comma', () => {
    expect(formatNumber(1.25, 1)).toBe('1,3');
    expect(formatNumber(75)).toBe('75');
    expect(formatRating(4.5)).toBe('4,5');
    expect(formatRating(4)).toBe('4,0');
    expect(formatRating(null)).toBe('—');
  });

  it('formats grams with display rounding', () => {
    expect(formatGrams(578.4)).toBe('578 g');
    expect(formatGrams(5.78)).toBe('5,8 g');
    expect(formatGrams(12.34, 'yeast')).toBe('12,3 g');
    expect(formatGrams(10, 'yeast')).toBe('10 g');
  });

  it('formats dates like the design', () => {
    const d = new Date(2026, 9, 12, 12);
    expect(formatDate(d)).toBe('12 oct 2026');
    expect(formatDateLong(d)).toBe('lunes 12 oct 2026');
  });

  it('formats durations', () => {
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(270)).toBe('4 h 30 min');
    expect(formatDuration(720)).toBe('12 h');
    expect(formatDuration(null)).toBe('—');
  });

  it('parses comma and point decimals', () => {
    expect(parseDecimal('0,5')).toBe(0.5);
    expect(parseDecimal('0.5')).toBe(0.5);
    expect(parseDecimal(' 75 ')).toBe(75);
    expect(parseDecimal('')).toBeNull();
    expect(parseDecimal('abc')).toBeNull();
    expect(parseDecimal('1,2,3')).toBeNull();
  });
});
