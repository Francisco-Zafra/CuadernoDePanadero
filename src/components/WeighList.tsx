import { computeDough } from '../domain/bakersMath';
import { formatGrams, formatGramsValue, formatHours } from '../domain/format';
import type { Recipe } from '../domain/types';
import { prefermentName } from '../domain/defaults';
import { es } from '../i18n/es';
import { recipeBlocks } from './recipeBlocks';

/**
 * "Pesa esto": grams in large type, one block per stage. Used by the calculator
 * and, with `kitchen`, by the kitchen mode.
 */
export function WeighList({ recipe, kitchen = false }: { recipe: Recipe; kitchen?: boolean }) {
  const result = computeDough(recipe);
  const blocks = recipeBlocks(recipe, result);
  const hours = formatHours(recipe.preferment.hours);
  return (
    <div className={`weigh${kitchen ? ' weigh--kitchen' : ''}`}>
      {blocks.map((b) => {
        const title =
          b.key === 'preferment'
            ? `${es.recipe.prefermentBlock} · ${prefermentName(recipe.preferment)}`
            : b.title;
        const sub =
          b.key === 'preferment'
            ? hours
              ? kitchen
                ? es.kitchen.hoursBefore(hours)
                : es.recipe.prefHoursBefore(hours)
              : null
            : b.sub;
        return (
          <div key={b.key} className="weigh__block">
            {title && (
              <h3 className="weigh__title">
                <span>{title}</span>
                {sub && <span className="weigh__sub">{sub}</span>}
              </h3>
            )}
            <dl className="weigh__list">
              {b.rows.map((row) => {
                const big = row.line.kind === 'flour' || row.line.kind === 'water';
                return (
                  <div
                    key={row.key}
                    className={`weigh__row${row.isPreferment ? ' is-pref' : ''}${big ? ' is-big' : ''}${row.line.kind === 'water' ? ' is-water' : ''}`}
                  >
                    <dt>{row.label}</dt>
                    <dd>
                      <span className={`weigh__g${row.line.grams < 0 ? ' is-negative' : ''}`}>
                        {formatGramsValue(row.line.grams, row.line.kind)}
                      </span>
                      <span className="weigh__unit">g</span>
                    </dd>
                  </div>
                );
              })}
              <div className="weigh__total">
                <dt>{b.totalLabel}</dt>
                <dd>{formatGrams(b.totalGrams)}</dd>
              </div>
            </dl>
          </div>
        );
      })}
      {result.warnings.includes('negativeFinalWater') && (
        <p className="notice" role="alert">
          {es.recipe.warnNegativeWater}
        </p>
      )}
    </div>
  );
}
