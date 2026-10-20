import { computeDough } from '../domain/bakersMath';
import { formatGrams, formatPct } from '../domain/format';
import type { Recipe } from '../domain/types';
import { es } from '../i18n/es';
import { recipeBlocks } from './recipeBlocks';

export type RecipeView = 'both' | 'pct' | 'grams';

interface Props {
  recipe: Recipe;
  view?: RecipeView;
  /** Heading level for block titles. */
  headingLevel?: 'h3' | 'h4';
}

/** Recipe in two blocks (Prefermento / Masa final), with %, grams or both. */
export function RecipeTable({ recipe, view = 'both', headingLevel = 'h3' }: Props) {
  const result = computeDough(recipe);
  const blocks = recipeBlocks(recipe, result);
  const H = headingLevel;
  const showPct = view !== 'grams';
  const showGrams = view !== 'pct';

  return (
    <div className="recipe">
      {blocks.map((b) => (
        <div key={b.key} className="recipe__block">
          {b.title && (
            <H className="recipe__title">
              <span>{b.title}</span>
              {b.sub && <span className="recipe__sub">{b.sub}</span>}
            </H>
          )}
          <table className="recipe-table">
            <thead>
              <tr>
                <th scope="col">{es.recipe.colIngredient}</th>
                {showPct && (
                  <th scope="col" className="num">
                    {es.recipe.colPct}
                  </th>
                )}
                {showGrams && (
                  <th scope="col" className="num">
                    {es.recipe.colGrams}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((r) => (
                <tr key={r.key} className={r.isPreferment ? 'is-pref' : undefined}>
                  <th scope="row">{r.label}</th>
                  {showPct && <td className="num">{formatPct(r.line.pct)}</td>}
                  {showGrams && (
                    <td className={`num${r.line.grams < 0 ? ' is-negative' : ''}`}>
                      {formatGrams(r.line.grams, r.line.kind)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">{b.totalLabel}</th>
                {showPct && <td className="num">{formatPct(b.totalPct)}</td>}
                {showGrams && <td className="num">{formatGrams(b.totalGrams)}</td>}
              </tr>
            </tfoot>
          </table>
        </div>
      ))}
      <HydrationBox recipe={recipe} />
      {result.warnings.includes('negativeFinalWater') && (
        <p className="notice" role="alert">
          {es.recipe.warnNegativeWater}
        </p>
      )}
      {result.warnings.includes('floursNot100') && (
        <p className="notice" role="alert">
          {es.recipe.floursSum(formatPct(recipe.flours.reduce((s, f) => s + f.pct, 0)))}
        </p>
      )}
    </div>
  );
}

export function HydrationBox({ recipe }: { recipe: Recipe }) {
  const r = computeDough(recipe);
  return (
    <div className="hydration-box">
      <span className="hydration-box__text">
        <span className="hydration-box__title">{es.recipe.totalHydration}</span>
        <span className="hydration-box__sub">
          {es.recipe.totalHydrationSub(
            formatGrams(r.totals.water),
            formatGrams(r.totals.flour),
            recipe.preferment.kind !== 'none',
          )}
        </span>
      </span>
      <span className="hydration-box__value">{formatPct(recipe.hydration)}</span>
    </div>
  );
}
