import { RATING_MAX, RATING_STEP } from '../domain/defaults';
import { formatRating } from '../domain/format';
import { es } from '../i18n/es';
import { IconMinus, IconPlus } from './Icons';

/** Big rating number with "de 5" under it. */
export function RatingDisplay({ value }: { value: number | null }) {
  return (
    <div
      className="rating-display"
      aria-label={`${es.result.rating}: ${value == null ? es.result.noRating : `${formatRating(value)} ${es.result.ratingOf(RATING_MAX)}`}`}
    >
      <span className="rating-display__value" aria-hidden="true">
        {formatRating(value)}
      </span>
      <span className="rating-display__of" aria-hidden="true">
        {value == null ? es.result.noRating : es.result.ratingOf(RATING_MAX)}
      </span>
    </div>
  );
}

/** Rating input: − / + in half steps, from 1 to RATING_MAX, or none. */
export function RatingInput({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const mid = Math.ceil(RATING_MAX / 2);
  const dec = () => onChange(value == null ? mid : Math.max(1, value - RATING_STEP));
  const inc = () => onChange(value == null ? mid : Math.min(RATING_MAX, value + RATING_STEP));
  return (
    <div className="rating-input">
      <div className="stepper" role="group" aria-label={es.result.rating}>
        <span className="stepper__text">
          <span className="stepper__label">{es.result.rating}</span>
          <span className="stepper__sub">
            {value == null ? es.result.noRating : es.result.ratingOf(RATING_MAX)}
          </span>
        </span>
        <span className="stepper__controls">
          <button
            type="button"
            className="round-btn"
            aria-label={es.common.decrease(es.result.rating)}
            onClick={dec}
            disabled={value != null && value <= 1}
          >
            <IconMinus size={18} />
          </button>
          <output className="stepper__value stepper__value--big" aria-live="polite">
            {formatRating(value)}
          </output>
          <button
            type="button"
            className="round-btn"
            aria-label={es.common.increase(es.result.rating)}
            onClick={inc}
            disabled={value != null && value >= RATING_MAX}
          >
            <IconPlus size={18} />
          </button>
        </span>
      </div>
      {value != null && (
        <button type="button" className="link-btn" onClick={() => onChange(null)}>
          {es.result.clearRating}
        </button>
      )}
    </div>
  );
}
