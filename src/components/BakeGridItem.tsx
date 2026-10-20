import { Link } from 'react-router';
import { prefermentName } from '../domain/defaults';
import { formatPct, formatRating } from '../domain/format';
import type { Bake } from '../domain/types';
import { es } from '../i18n/es';
import { BakeThumb } from './BakeThumb';

/** Photo grid cell for the journal. */
export function BakeGridItem({ bake }: { bake: Bake }) {
  const pref = bake.recipe.preferment;
  const meta = [
    pref.kind === 'none' ? es.types[bake.type] : prefermentName(pref),
    formatPct(bake.recipe.hydration),
    bake.status === 'incomplete' ? es.journal.incomplete : formatRating(bake.rating),
  ].join(' · ');
  return (
    <li>
      <Link to={`/bake/${bake.id}`} className="grid-item">
        <BakeThumb bake={bake} silhouette={84} />
        <span className="grid-item__name">{bake.name}</span>
        <span className="grid-item__meta">{meta}</span>
      </Link>
    </li>
  );
}
