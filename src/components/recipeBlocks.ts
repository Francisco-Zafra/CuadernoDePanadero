// Turns a DoughResult into labelled rows for the weigh table (Prefermento | Masa final).

import { computeDough, type DoughResult, type Line } from '../domain/bakersMath';
import { prefermentName } from '../domain/defaults';
import type { Recipe } from '../domain/types';
import { es } from '../i18n/es';

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

export interface WeighRow {
  key: string;
  label: string;
  /** Grams in the preferment column; null when the ingredient is not there. */
  pref: Line | null;
  final: Line | null;
  isPreferment: boolean;
}

/** One row per ingredient with its preferment and final-dough grams side by side. */
export function weighRows(recipe: Recipe, result: DoughResult = computeDough(recipe)): WeighRow[] {
  const pref = result.preferment ?? [];
  const of = (lines: Line[], kind: Line['kind']) => lines.filter((l) => l.kind === kind);
  const row = (key: string, label: string, p: Line | null, f: Line | null): WeighRow => ({
    key,
    label,
    pref: p,
    final: f,
    isPreferment: f?.kind === 'preferment',
  });
  const out: WeighRow[] = [];

  const prefFlour = of(pref, 'flour')[0] ?? null;
  const finalFlours = of(result.final, 'flour');
  if (prefFlour && finalFlours.length !== 1)
    out.push(row('flour-pref', lineLabel(prefFlour, recipe), prefFlour, null));
  finalFlours.forEach((f, i) =>
    out.push(
      row(`flour-${i}`, lineLabel(f, recipe), finalFlours.length === 1 ? prefFlour : null, f),
    ),
  );

  const water = of(result.final, 'water')[0] ?? null;
  out.push(row('water', es.recipe.water, of(pref, 'water')[0] ?? null, water));
  for (const s of of(result.final, 'salt')) out.push(row('salt', es.recipe.salt, null, s));

  const prefYeast = of(pref, 'yeast')[0] ?? null;
  const finalYeast = of(result.final, 'yeast')[0] ?? null;
  if (prefYeast || finalYeast)
    out.push(
      row(
        'yeast',
        prefYeast || !finalYeast ? es.recipe.yeast : lineLabel(finalYeast, recipe),
        prefYeast,
        finalYeast,
      ),
    );
  for (const s of of(pref, 'starter')) out.push(row('starter', es.preferments.seed, s, null));

  of(result.final, 'extra').forEach((e, i) =>
    out.push(row(`extra-${i}`, lineLabel(e, recipe), null, e)),
  );
  for (const p of of(result.final, 'preferment'))
    out.push(row('pref', lineLabel(p, recipe), null, p));
  return out;
}
