import { prefermentName } from '../domain/defaults';
import { formatDateLong } from '../domain/format';
import type { Bake } from '../domain/types';
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
