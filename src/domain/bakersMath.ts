// Baker's percentage math. All percentages are over the TOTAL flour
// (preferment flour + final dough flour). Everything is computed unrounded;
// rounding happens only for display (see roundGrams).

import type { Recipe } from './types';

export type LineKind = 'flour' | 'water' | 'salt' | 'yeast' | 'starter' | 'extra' | 'preferment';

export interface Line {
  kind: LineKind;
  /** User-given name for flours and extras; undefined for fixed ingredients. */
  name?: string;
  /** Baker's % over the total flour. */
  pct: number;
  grams: number;
}

export type Warning = 'negativeFinalWater' | 'floursNot100';

export interface DoughTotals {
  /** Total dough weight (pieces × pieceWeight). */
  dough: number;
  flour: number;
  water: number;
  /** Weight of the whole preferment (0 when there is none). */
  preferment: number;
}

export interface DoughResult {
  totalFlour: number;
  preferment: Line[] | null;
  final: Line[];
  totals: DoughTotals;
  warnings: Warning[];
}

const sumPct = (items: { pct: number }[]) => items.reduce((s, i) => s + (Number(i.pct) || 0), 0);

export function hasPreferment(recipe: Recipe): boolean {
  return recipe.preferment.kind !== 'none';
}

/** Yeast % that actually goes into the final dough (0 when kind is 'none'). */
export function finalYeastPct(recipe: Recipe): number {
  return recipe.yeast.kind === 'none' ? 0 : recipe.yeast.pct;
}

/** Preferment yeast expressed over the total flour. */
export function prefermentYeastOverTotalPct(recipe: Recipe): number {
  if (!hasPreferment(recipe)) return 0;
  return (recipe.preferment.flourPct * recipe.preferment.yeastPct) / 100;
}

export function totalDoughWeight(recipe: Recipe): number {
  return recipe.pieces * recipe.pieceWeight;
}

/** Dough weight per gram of total flour (1 + the sum of every other % / 100). */
function doughPerFlour(recipe: Recipe): number {
  const pctSum =
    recipe.hydration +
    recipe.salt +
    finalYeastPct(recipe) +
    sumPct(recipe.extras) +
    prefermentYeastOverTotalPct(recipe);
  return 1 + pctSum / 100;
}

/** Total flour F such that all ingredients add up exactly to the dough weight W. */
export function totalFlourFor(recipe: Recipe): number {
  const divisor = doughPerFlour(recipe);
  return divisor > 0 ? totalDoughWeight(recipe) / divisor : 0;
}

/** Inverse of totalFlourFor: the piece weight that yields `flour` grams of total flour. */
export function pieceWeightForFlour(recipe: Recipe, flour: number): number {
  return recipe.pieces > 0 ? (flour * doughPerFlour(recipe)) / recipe.pieces : 0;
}

/** How the dough is sized: by total flour or by piece weight. */
export type SizeBy = 'flour' | 'piece';

/** Rescales the piece weight so `recipe` keeps `flour` grams of total flour. */
export function withFlour(recipe: Recipe, flour: number): Recipe {
  return {
    ...recipe,
    pieceWeight: pieceWeightForFlour(recipe, flour),
  };
}

/** Applies an edit; in flour mode the total flour stays fixed and the piece weight follows it. */
export function resize(prev: Recipe, next: Recipe, sizeBy: SizeBy): Recipe {
  return sizeBy === 'flour' ? withFlour(next, totalFlourFor(prev)) : next;
}

export function computeDough(recipe: Recipe): DoughResult {
  const W = totalDoughWeight(recipe);
  const F = totalFlourFor(recipe);
  const pctOf = (grams: number) => (F > 0 ? (grams / F) * 100 : 0);
  const warnings: Warning[] = [];

  const flourMix = sumPct(recipe.flours);
  if (recipe.flours.length > 0 && Math.abs(flourMix - 100) > 0.01) warnings.push('floursNot100');

  const totalWater = (F * recipe.hydration) / 100;
  const salt = (F * recipe.salt) / 100;
  const yeastFinal = (F * finalYeastPct(recipe)) / 100;

  let prefLines: Line[] | null = null;
  let Fp = 0;
  let Wp = 0;
  let Yp = 0;

  if (hasPreferment(recipe)) {
    const pref = recipe.preferment;
    Fp = (F * pref.flourPct) / 100;
    Wp = (Fp * pref.hydration) / 100;
    Yp = (Fp * pref.yeastPct) / 100;

    const flourName = recipe.flours.length === 1 ? recipe.flours[0]?.name : undefined;
    prefLines = [
      { kind: 'flour', name: flourName, pct: pref.flourPct, grams: Fp },
      { kind: 'water', pct: pctOf(Wp), grams: Wp },
    ];
    if (pref.yeastPct > 0) {
      prefLines.push({
        kind: pref.kind === 'sourdough' ? 'starter' : 'yeast',
        pct: pctOf(Yp),
        grams: Yp,
      });
    }
  }

  const finalFlour = F - Fp;
  const finalWater = totalWater - Wp;
  if (prefLines && finalWater < 0) warnings.push('negativeFinalWater');

  const final: Line[] = [];
  const flours = recipe.flours.length > 0 ? recipe.flours : [{ name: undefined, pct: 100 }];
  const mix = flourMix > 0 ? flourMix : 100;
  for (const fl of flours) {
    const grams = (finalFlour * (fl.pct || 0)) / mix;
    final.push({ kind: 'flour', name: fl.name, pct: pctOf(grams), grams });
  }
  final.push({ kind: 'water', pct: pctOf(finalWater), grams: finalWater });
  final.push({ kind: 'salt', pct: recipe.salt, grams: salt });
  if (yeastFinal > 0) final.push({ kind: 'yeast', pct: finalYeastPct(recipe), grams: yeastFinal });
  for (const ex of recipe.extras) {
    final.push({ kind: 'extra', name: ex.name, pct: ex.pct, grams: (F * ex.pct) / 100 });
  }

  const prefWeight = Fp + Wp + Yp;
  if (prefLines) final.push({ kind: 'preferment', pct: pctOf(prefWeight), grams: prefWeight });

  return {
    totalFlour: F,
    preferment: prefLines,
    final,
    totals: { dough: W, flour: F, water: totalWater, preferment: prefWeight },
    warnings,
  };
}

/** Sum of a block's grams (handy for block totals). */
export function sumGrams(lines: Line[]): number {
  return lines.reduce((s, l) => s + l.grams, 0);
}

export function sumLinePct(lines: Line[]): number {
  return lines.reduce((s, l) => s + l.pct, 0);
}

/**
 * Display rounding: whole grams, except yeast/starter and anything under 10 g,
 * which get one decimal.
 */
export function roundGrams(grams: number, kind?: LineKind): number {
  const fine = kind === 'yeast' || Math.abs(grams) < 10;
  return fine ? Math.round(grams * 10) / 10 : Math.round(grams);
}
