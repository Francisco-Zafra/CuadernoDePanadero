import { prefermentName } from '../domain/defaults';
import { formatDateLong, formatHours, formatPct } from '../domain/format';
import type { Bake, SavedPreferment } from '../domain/types';
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
