import { useState } from 'react';
import type { Ingredient, Recipe } from '../domain/types';
import { es } from '../i18n/es';
import { resize, type SizeBy } from '../domain/bakersMath';
import { DoughSection } from './DoughSection';
import { IconClose, IconPlus } from './Icons';
import { NumberField } from './NumberField';
import { PrefermentPicker, type NewCustom } from './PrefermentPicker';
import { WeighTable } from './WeighTable';

interface Props {
  recipe: Recipe;
  onChange: (r: Recipe) => void;
  newCustom: NewCustom | null;
  onNewCustomChange: (c: NewCustom | null) => void;
}

/** Full recipe form: preferment, dough size and percentages, flours, extras and the result table. */
export function RecipeEditor({ recipe, onChange, newCustom, onNewCustomChange }: Props) {
  const [sizeBy, setSizeBy] = useState<SizeBy>('flour');
  const set = (patch: Partial<Recipe>) => onChange(resize(recipe, { ...recipe, ...patch }, sizeBy));

  return (
    <div className="recipe-editor">
      <PrefermentPicker
        id="pref-t"
        headingClassName="h2"
        value={recipe.preferment}
        onChange={(p) => set({ preferment: p })}
        newCustom={newCustom}
        onNewCustomChange={onNewCustomChange}
      />

      <DoughSection
        id="dough-t"
        headingClassName="h2"
        recipe={recipe}
        onChange={onChange}
        sizeBy={sizeBy}
        onSizeByChange={setSizeBy}
      />

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
        <h2 id="ing-t" className="h2">
          {es.recipe.ingredients}
        </h2>
        <WeighTable recipe={recipe} />
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
