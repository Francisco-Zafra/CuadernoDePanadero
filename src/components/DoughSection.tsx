import { useState } from 'react';
import {
  resize,
  totalDoughWeight,
  totalFlourFor,
  withFlour,
  type SizeBy,
} from '../domain/bakersMath';
import { formatGramsValue } from '../domain/format';
import type { Recipe, YeastKind } from '../domain/types';
import { convertYeast } from '../domain/yeast';
import { es } from '../i18n/es';
import { doughSummary } from './bakeText';
import { FieldCell, OutputCell } from './FieldGrid';
import { Fold } from './Fold';
import { IconMinus, IconPlus } from './Icons';
import { Tabs } from './Tabs';

interface Props {
  id: string;
  headingClassName: string;
  recipe: Recipe;
  onChange: (r: Recipe) => void;
  sizeBy: SizeBy;
  onSizeByChange: (v: SizeBy) => void;
}

const YEAST_KINDS: YeastKind[] = ['fresh', 'instant', 'active_dry', 'none'];

/**
 * Dough size and percentages, shared by the calculator and the bake editor:
 * a one-line summary that opens into a compact grid.
 */
export function DoughSection({
  id,
  headingClassName,
  recipe,
  onChange,
  sizeBy,
  onSizeByChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const flour = totalFlourFor(recipe);
  const set = (patch: Partial<Recipe>) => onChange(resize(recipe, { ...recipe, ...patch }, sizeBy));

  const pickSizeBy = (v: SizeBy) => {
    if (v === sizeBy) return;
    onSizeByChange(v);
    onChange(
      v === 'flour'
        ? withFlour(recipe, Math.round(flour))
        : { ...recipe, pieceWeight: Math.round(recipe.pieceWeight) },
    );
  };

  // More or fewer pieces of the same weight (one more pizza ball), whatever the size mode.
  const setPieces = (n: number) => onChange({ ...recipe, pieces: Math.max(1, Math.round(n)) });

  const noYeast = recipe.yeast.kind === 'none';
  const summary = doughSummary(recipe);
  const yeastSelect = (
    <select
      className="cell__select"
      aria-label={es.recipe.yeastKind}
      value={recipe.yeast.kind}
      onChange={(e) => {
        const kind = e.target.value as YeastKind;
        set({ yeast: { kind, pct: convertYeast(recipe.yeast.pct, recipe.yeast.kind, kind) } });
      }}
    >
      {YEAST_KINDS.map((k) => (
        <option key={k} value={k}>
          {es.recipe.yeastShort[k]}
        </option>
      ))}
    </select>
  );

  return (
    <section className="form-section" aria-labelledby={id}>
      <div className="section-head section-head--center">
        <h2 id={id} className={headingClassName}>
          {es.calculator.dough}
        </h2>
        <span className="pieces" role="group" aria-label={es.recipe.pieces}>
          <button
            type="button"
            className="round-btn round-btn--sm"
            aria-label={es.common.decrease(es.recipe.pieces)}
            onClick={() => setPieces(recipe.pieces - 1)}
            disabled={recipe.pieces <= 1}
          >
            <IconMinus size={16} />
          </button>
          <output className="pieces__value" aria-live="polite">
            {es.recipe.piecesCount(recipe.pieces)}
          </output>
          <button
            type="button"
            className="round-btn round-btn--sm"
            aria-label={es.common.increase(es.recipe.pieces)}
            onClick={() => setPieces(recipe.pieces + 1)}
          >
            <IconPlus size={16} />
          </button>
        </span>
      </div>
      <Fold summary={summary} open={open} onToggle={() => setOpen(!open)} className="fold--ruled">
        <Tabs<SizeBy>
          label={es.calculator.sizeBy}
          value={sizeBy}
          onChange={pickSizeBy}
          options={[
            { value: 'flour', label: es.calculator.sizeByFlour },
            { value: 'piece', label: es.calculator.sizeByPiece },
          ]}
          className="tabs--sm"
        />
        <div className="field-grid">
          <FieldCell
            label={es.recipe.hydration}
            value={recipe.hydration}
            onChange={(v) => set({ hydration: v })}
            min={30}
            max={150}
            unit="%"
            accent
          />
          <FieldCell
            label={es.recipe.salt}
            value={recipe.salt}
            onChange={(v) => set({ salt: v })}
            max={10}
            unit="%"
          />
          <FieldCell
            label={es.recipe.yeast}
            head={yeastSelect}
            value={noYeast ? 0 : recipe.yeast.pct}
            onChange={(v) => set({ yeast: { ...recipe.yeast, pct: v } })}
            decimals={2}
            unit="%"
            disabled={noYeast}
          />
          {sizeBy === 'flour' ? (
            <FieldCell
              label={es.calculator.flourWeight}
              value={flour}
              onChange={(v) => onChange(withFlour(recipe, v))}
              min={10}
              decimals={0}
              unit="g"
            />
          ) : (
            <FieldCell
              label={es.recipe.pieceWeight}
              value={recipe.pieceWeight}
              onChange={(v) => set({ pieceWeight: v })}
              min={10}
              decimals={0}
              unit="g"
            />
          )}
          <OutputCell
            label={es.recipe.totalDough}
            value={formatGramsValue(totalDoughWeight(recipe))}
            unit="g"
          />
        </div>
      </Fold>
    </section>
  );
}
