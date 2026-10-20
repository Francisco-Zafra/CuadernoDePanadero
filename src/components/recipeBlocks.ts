// Turns a DoughResult into labelled display blocks (Prefermento / Masa final).

import {
  computeDough,
  sumGrams,
  sumLinePct,
  type DoughResult,
  type Line,
} from '../domain/bakersMath';
import { prefermentName } from '../domain/defaults';
import { formatHours, formatPct, formatTemp } from '../domain/format';
import type { Recipe } from '../domain/types';
import { es } from '../i18n/es';

export interface DisplayRow {
  key: string;
  label: string;
  line: Line;
  /** The whole preferment as an ingredient of the final dough. */
  isPreferment: boolean;
}

export interface DisplayBlock {
  key: 'preferment' | 'final';
  title: string | null;
  sub: string | null;
  rows: DisplayRow[];
  totalLabel: string;
  totalPct: number;
  totalGrams: number;
}

export function lineLabel(line: Line, recipe: Recipe): string {
  switch (line.kind) {
    case 'flour':
      return line.name?.trim() || (recipe.flours.length > 1 ? es.recipe.flourMix : es.recipe.flour);
    case 'water':
      return es.recipe.water;
    case 'salt':
      return es.recipe.salt;
    case 'yeast':
      return `${es.recipe.yeast} · ${es.recipe.yeastKinds[recipe.yeast.kind].toLowerCase()}`;
    case 'starter':
      return es.preferments.seed;
    case 'extra':
      return line.name?.trim() || es.recipe.extraName;
    case 'preferment':
      return es.recipe.prefEntire(prefermentName(recipe.preferment));
  }
}

function prefYeastLabel(line: Line, recipe: Recipe): string {
  return line.kind === 'yeast' ? es.recipe.yeast : lineLabel(line, recipe);
}

function rows(lines: Line[], recipe: Recipe, inPref: boolean): DisplayRow[] {
  return lines.map((line, i) => ({
    key: `${line.kind}-${i}`,
    label: inPref ? prefYeastLabel(line, recipe) : lineLabel(line, recipe),
    line,
    isPreferment: line.kind === 'preferment',
  }));
}

export function recipeBlocks(
  recipe: Recipe,
  result: DoughResult = computeDough(recipe),
): DisplayBlock[] {
  const blocks: DisplayBlock[] = [];
  const pref = recipe.preferment;
  const name = prefermentName(pref);
  if (result.preferment) {
    blocks.push({
      key: 'preferment',
      title: es.recipe.prefermentBlock,
      sub: es.recipe.prefSub(
        name,
        formatHours(pref.hours),
        formatTemp(pref.tempC),
        formatPct(pref.hydration),
      ),
      rows: rows(result.preferment, recipe, true),
      totalLabel: name,
      totalPct: sumLinePct(result.preferment),
      totalGrams: sumGrams(result.preferment),
    });
  }
  blocks.push({
    key: 'final',
    title: result.preferment ? es.recipe.finalBlock : null,
    sub: result.preferment ? es.recipe.finalSub : null,
    rows: rows(result.final, recipe, false),
    totalLabel: es.recipe.totalDough,
    totalPct: sumLinePct(result.final),
    totalGrams: sumGrams(result.final),
  });
  return blocks;
}
