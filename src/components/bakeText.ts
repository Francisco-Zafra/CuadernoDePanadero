import { totalFlourFor } from '../domain/bakersMath';
import { prefermentName } from '../domain/defaults';
import {
  formatDateLong,
  formatDuration,
  formatGrams,
  formatHours,
  formatPct,
  formatTemp,
} from '../domain/format';
import type { Bake, ProcessStep, Recipe, SavedPreferment } from '../domain/types';
import { es } from '../i18n/es';

/** "Pan · con masa madre · domingo 12 oct 2026" */
export function metaLine(bake: Bake): string {
  const pref = bake.recipe.preferment;
  return [
    es.types[bake.type],
    pref.kind === 'none' ? es.journal.noPreferment : es.preferments.withPref(prefermentName(pref)),
    formatDateLong(bake.date),
  ].join(' · ');
}

/** "100 % de hidratación · levadura 0,1 % · 14 h" */
export function prefermentSummary(
  p: Pick<SavedPreferment, 'hydration' | 'yeastPct' | 'hours'>,
  seed: boolean,
) {
  return es.preferments.summary({
    hydration: formatPct(p.hydration),
    yeast: p.yeastPct > 0 ? formatPct(p.yeastPct) : null,
    hours: formatHours(p.hours) ?? '',
    seed,
  });
}

/** "3 pliegues cada 20 min · 24 °C · nota", or the bake's stretches. */
export function stepDetail(s: ProcessStep): string {
  if (s.kind === 'bake' && s.stages && s.stages.length > 0) {
    const stages = s.stages.map((st) =>
      es.process.stageSummary(
        st.min != null ? formatDuration(st.min) : null,
        formatTemp(st.tempC),
        st.note.trim(),
      ),
    );
    return [...stages, s.note.trim()].filter(Boolean).join(' · ');
  }
  const folds =
    s.kind === 'folds' ? es.process.foldsSummary(s.foldCount ?? null, s.foldEveryMin ?? null) : '';
  return [folds, formatTemp(s.tempC), s.note.trim()].filter(Boolean).join(' · ');
}

/** "500 g de harina · 4 × 250 g · 70 % de hidratación · sal 2 % · levadura 0,5 %" */
export function doughSummary(r: Recipe): string {
  return es.recipe.doughSummary({
    flour: formatGrams(Math.round(totalFlourFor(r))),
    pieces: r.pieces,
    piece: formatGrams(Math.round(r.pieceWeight)),
    hydration: formatPct(r.hydration),
    salt: formatPct(r.salt),
    yeast: r.yeast.kind === 'none' ? null : formatPct(r.yeast.pct),
  });
}
