import { useState } from 'react';
import { totalDoughWeight } from '../domain/bakersMath';
import { formatGrams } from '../domain/format';
import type { Ingredient, Recipe, YeastKind } from '../domain/types';
import { convertYeast } from '../domain/yeast';
import { es } from '../i18n/es';
import { IconClose, IconPlus } from './Icons';
import { NumberField } from './NumberField';
import { PrefermentPicker, type NewCustom } from './PrefermentPicker';
import { RecipeTable, type RecipeView } from './RecipeTable';
import { Stepper } from './Stepper';
import { adaptiveStep } from './steps';
import { Tabs } from './Tabs';

interface Props {
  recipe: Recipe;
  onChange: (r: Recipe) => void;
  newCustom: NewCustom | null;
  onNewCustomChange: (c: NewCustom | null) => void;
}

const YEAST_KINDS: YeastKind[] = ['fresh', 'instant', 'active_dry', 'none'];

/** Full recipe form: dough size, percentages, preferment, flours, extras and the result table. */
export function RecipeEditor({ recipe, onChange, newCustom, onNewCustomChange }: Props) {
  const [view, setView] = useState<RecipeView>('both');
  const set = (patch: Partial<Recipe>) => onChange({ ...recipe, ...patch });

  const changeYeastKind = (kind: YeastKind) => {
    const from = recipe.yeast.kind;
    set({ yeast: { kind, pct: convertYeast(recipe.yeast.pct, from, kind) } });
  };

  return (
    <div className="recipe-editor">
      <section className="form-section" aria-labelledby="dough-t">
        <h2 id="dough-t" className="h2">
          {es.calculator.dough}
        </h2>
        <div className="steppers steppers--ruled">
          <Stepper
            label={es.recipe.pieces}
            sub={es.recipe.piecesSub(recipe.pieces)}
            value={recipe.pieces}
            onChange={(v) => set({ pieces: Math.max(1, Math.round(v)) })}
            min={1}
            decimals={0}
          />
          <Stepper
            label={es.recipe.pieceWeight}
            sub={`${es.recipe.totalDough}: ${formatGrams(totalDoughWeight(recipe))}`}
            value={recipe.pieceWeight}
            onChange={(v) => set({ pieceWeight: v })}
            step={10}
            min={10}
            decimals={0}
            unit="g"
          />
          <Stepper
            label={es.recipe.hydration}
            sub={es.recipe.hydrationSub}
            value={recipe.hydration}
            onChange={(v) => set({ hydration: v })}
            min={30}
            max={150}
            unit="%"
            accent
          />
          <Stepper
            label={es.recipe.salt}
            sub={es.recipe.saltSub}
            value={recipe.salt}
            onChange={(v) => set({ salt: v })}
            step={0.1}
            max={10}
            unit="%"
          />
          <label className="select-row">
            <span className="stepper__label">{es.recipe.yeastKind}</span>
            <select
              className="input-line"
              value={recipe.yeast.kind}
              onChange={(e) => changeYeastKind(e.target.value as YeastKind)}
            >
              {YEAST_KINDS.map((k) => (
                <option key={k} value={k}>
                  {es.recipe.yeastKinds[k]}
                </option>
              ))}
            </select>
          </label>
          {recipe.yeast.kind !== 'none' && (
            <Stepper
              label={es.recipe.yeast}
              sub={
                recipe.preferment.kind === 'none'
                  ? es.recipe.yeastKinds[recipe.yeast.kind]
                  : es.recipe.yeastFinalSub(es.recipe.yeastKinds[recipe.yeast.kind])
              }
              value={recipe.yeast.pct}
              onChange={(v) => set({ yeast: { ...recipe.yeast, pct: v } })}
              step={adaptiveStep}
              decimals={2}
              unit="%"
            />
          )}
        </div>
      </section>

      <section className="form-section" aria-labelledby="pref-t">
        <h2 id="pref-t" className="h2">
          {es.preferments.sectionTitle}
        </h2>
        <PrefermentPicker
          value={recipe.preferment}
          onChange={(p) => set({ preferment: p })}
          newCustom={newCustom}
          onNewCustomChange={onNewCustomChange}
        />
      </section>

      <section className="form-section" aria-labelledby="flours-t">
        <h2 id="flours-t" className="h2">
          {es.recipe.flours}
        </h2>
        <IngredientList
          items={recipe.flours}
          onChange={(flours) => set({ flours })}
          nameLabel={es.recipe.flourName}
          pctLabel={es.recipe.flourPct}
          addLabel={es.recipe.addFlour}
          placeholder={es.recipe.defaultFlour}
          newItem={() => ({
            name: '',
            pct: Math.max(0, 100 - recipe.flours.reduce((s, f) => s + f.pct, 0)),
          })}
          minItems={1}
        />
      </section>

      <section className="form-section" aria-labelledby="extras-t">
        <h2 id="extras-t" className="h2">
          {es.recipe.extras}
        </h2>
        <IngredientList
          items={recipe.extras}
          onChange={(extras) => set({ extras })}
          nameLabel={es.recipe.extraName}
          pctLabel={es.recipe.extraPct}
          addLabel={es.recipe.addExtra}
          placeholder={es.recipe.extraPlaceholder}
          newItem={() => ({ name: '', pct: 1 })}
        />
      </section>

      <section className="form-section" aria-labelledby="ing-t">
        <div className="section-head">
          <h2 id="ing-t" className="h2">
            {es.recipe.ingredients}
          </h2>
          <Tabs<RecipeView>
            label={es.recipe.showAs}
            value={view}
            onChange={setView}
            options={[
              { value: 'both', label: '% y g' },
              { value: 'pct', label: '%' },
              { value: 'grams', label: 'g' },
            ]}
          />
        </div>
        <RecipeTable recipe={recipe} view={view} />
      </section>
    </div>
  );
}

interface ListProps {
  items: Ingredient[];
  onChange: (items: Ingredient[]) => void;
  nameLabel: string;
  pctLabel: string;
  addLabel: string;
  placeholder: string;
  newItem: () => Ingredient;
  minItems?: number;
}

function IngredientList({
  items,
  onChange,
  nameLabel,
  pctLabel,
  addLabel,
  placeholder,
  newItem,
  minItems = 0,
}: ListProps) {
  const update = (i: number, patch: Partial<Ingredient>) =>
    onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  return (
    <div className="ingredients">
      {items.length > 0 && (
        <ul className="ingredients__list">
          {items.map((it, i) => (
            <li key={i} className="ingredients__row">
              <input
                className="input-line"
                aria-label={`${nameLabel} ${i + 1}`}
                value={it.name}
                placeholder={placeholder}
                onChange={(e) => update(i, { name: e.target.value })}
              />
              <span className="ingredients__pct">
                <NumberField
                  className="input-line num"
                  aria-label={`${pctLabel} ${i + 1}`}
                  value={it.pct}
                  onChange={(v) => update(i, { pct: v ?? 0 })}
                  min={0}
                />
                <span className="ingredients__unit">%</span>
              </span>
              <button
                type="button"
                className="icon-btn"
                aria-label={`${es.common.remove} ${it.name || nameLabel.toLowerCase()}`}
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                disabled={items.length <= minItems}
              >
                <IconClose size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="link-btn" onClick={() => onChange([...items, newItem()])}>
        <IconPlus size={18} />
        {addLabel}
      </button>
    </div>
  );
}
