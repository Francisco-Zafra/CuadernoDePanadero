import { Link } from 'react-router';
import { formatDate, formatPct, formatRating } from '../domain/format';
import type { Bake } from '../domain/types';
import { BakeThumb } from './BakeThumb';
import { IncompleteMark, TypeChip } from './TypeChip';

/** Journal list row: thumb · name/type/date · hydration · rating. */
export function BakeRow({ bake, selected }: { bake: Bake; selected?: boolean }) {
  return (
    <li className="bake-row">
      <Link
        to={`/bake/${bake.id}`}
        className="bake-row__link"
        aria-current={selected ? 'true' : undefined}
      >
        <BakeThumb bake={bake} />
        <span className="bake-row__main">
          <span className="bake-row__name">{bake.name}</span>
          <TypeChip bake={bake} />
          <span className="bake-row__date">
            <span>{formatDate(bake.date)}</span>
            {bake.status === 'incomplete' && <IncompleteMark />}
          </span>
        </span>
        <span className="bake-row__num">
          {bake.status === 'complete' ? formatPct(bake.recipe.hydration) : '—'}
        </span>
        <span className={`bake-row__rating${bake.rating == null ? ' is-empty' : ''}`}>
          {formatRating(bake.rating)}
        </span>
      </Link>
    </li>
  );
}
