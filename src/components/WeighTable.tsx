import { computeDough, sumGrams, type Line } from '../domain/bakersMath';
import { prefermentName } from '../domain/defaults';
import { formatGramsValue, formatPct } from '../domain/format';
import type { Recipe } from '../domain/types';
import { es } from '../i18n/es';
import { weighRows } from './recipeBlocks';

/** Grams cell; `final` marks the final-dough column, where water is highlighted. */
function Grams({ line, final }: { line: Line | null; final?: boolean }) {
  if (!line)
    return (
      <td className="num is-empty" aria-label={es.calculator.notInBlock}>
        —
      </td>
    );
  const cls = `num${line.grams < 0 ? ' is-negative' : ''}${final && line.kind === 'water' ? ' is-water' : ''}`;
  return <td className={cls}>{formatGramsValue(line.grams, line.kind)}</td>;
}

/**
 * Grams to weigh, used by the calculator ("Pesa esto"), the recipe editor and, with
 * `kitchen`, in large type by the kitchen mode:
 * one table, with Prefermento and Masa final columns when there is one.
 */
export function WeighTable({ recipe, kitchen = false }: { recipe: Recipe; kitchen?: boolean }) {
  const result = computeDough(recipe);
  const rows = weighRows(recipe, result);
  const hasPref = result.preferment != null;

  return (
    <>
      <table
        className={`weigh-table${hasPref ? '' : ' weigh-table--single'}${kitchen ? ' weigh-table--kitchen' : ''}`}
      >
        <thead>
          <tr>
            <th scope="col">{hasPref ? es.recipe.colGrams : es.recipe.colIngredient}</th>
            {hasPref && (
              <th scope="col" className="num">
                {prefermentName(recipe.preferment)}
              </th>
            )}
            <th scope="col" className="num">
              {hasPref ? es.recipe.finalBlock : es.recipe.colGrams}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className={r.isPreferment ? 'is-pref' : undefined}>
              <th scope="row">{r.label}</th>
              {hasPref && <Grams line={r.pref} />}
              <Grams line={r.final} final />
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">{es.calculator.total}</th>
            {hasPref && (
              <td className="num">{formatGramsValue(sumGrams(result.preferment ?? []))}</td>
            )}
            <td className="num">{formatGramsValue(sumGrams(result.final))}</td>
          </tr>
        </tfoot>
      </table>
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
    </>
  );
}
