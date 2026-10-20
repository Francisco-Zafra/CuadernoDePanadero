// Yeast conversions, using fresh yeast as the reference:
//   instant = fresh / 3
//   active_dry = fresh × 0.4
// Sourdough is not a yeast kind and is never converted.

import type { YeastKind } from './types';

type ConvertibleYeast = Exclude<YeastKind, 'none'>;

const FROM_FRESH: Record<ConvertibleYeast, number> = {
  fresh: 1,
  instant: 1 / 3,
  active_dry: 0.4,
};

export function toFresh(amount: number, kind: ConvertibleYeast): number {
  return amount / FROM_FRESH[kind];
}

export function fromFresh(freshAmount: number, kind: ConvertibleYeast): number {
  return freshAmount * FROM_FRESH[kind];
}

/**
 * Converts a yeast amount (grams or %) between kinds. Converting from or to
 * 'none' leaves the value unchanged: there is nothing to convert.
 */
export function convertYeast(amount: number, from: YeastKind, to: YeastKind): number {
  if (from === to || from === 'none' || to === 'none') return amount;
  return fromFresh(toFresh(amount, from), to);
}
