import { prefermentName } from '../domain/defaults';
import type { Bake } from '../domain/types';
import { es } from '../i18n/es';
import { IconIncomplete } from './Icons';

/** "Pan · masa madre": type and preferment as plain text, no container. */
export function TypeChip({ bake }: { bake: Bake }) {
  const pref = bake.recipe.preferment;
  return (
    <span className="type-chip">
      {es.types[bake.type]} ·{' '}
      {pref.kind === 'none' ? es.journal.noPreferment : prefermentName(pref).toLowerCase()}
    </span>
  );
}

export function IncompleteMark() {
  return (
    <span className="incomplete-mark">
      <IconIncomplete />
      {es.journal.incomplete}
    </span>
  );
}
