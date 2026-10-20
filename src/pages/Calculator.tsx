import { useCallback, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { IconBookmark } from '../components/Icons';
import { PageHead } from '../components/PageHead';
import { PrefermentParams } from '../components/PrefermentParams';
import { Stepper } from '../components/Stepper';
import { adaptiveStep } from '../components/steps';
import { Tabs } from '../components/Tabs';
import { useToast } from '../components/Toast';
import { TypeField } from '../components/TypeField';
import { WeighList } from '../components/WeighList';
import { DEFAULT_PRESETS, prefermentFrom } from '../domain/defaults';
import { formatGrams } from '../domain/format';
import type { BakeType, Preferment, Recipe, YeastKind } from '../domain/types';
import { convertYeast } from '../domain/yeast';
import { useCatalog } from '../hooks/useCatalog';
import { useDraft } from '../hooks/useDraft';
import { es } from '../i18n/es';
import type { EditorPrefill } from './BakeEditor';

interface CalcState {
  presetId: string | null;
  presetName: string;
  type: BakeType;
  recipe: Recipe;
}

const YEAST_KINDS: YeastKind[] = ['fresh', 'instant', 'active_dry', 'none'];

const prefKey = (p: Preferment) => (p.kind === 'custom' ? (p.customId ?? 'custom') : p.kind);

export function Calculator() {
  const { presets, preferments, savePreset, newPresetId } = useCatalog();
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  const initial = useCallback((): CalcState => {
    const p = DEFAULT_PRESETS[2]!;
    return { presetId: null, presetName: '', type: p.type, recipe: structuredClone(p.recipe) };
  }, []);
  const draft = useDraft<CalcState>('calculator', initial);
  const s = draft.value;
  const r = s.recipe;
  const [saving, setSaving] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetType, setPresetType] = useState<BakeType>(s.type);

  // /calculator?preset=<id> (from Settings) loads that preset once.
  const requested = params.get('preset');
  const [loadedRequested, setLoadedRequested] = useState<string | null>(null);
  if (requested && requested !== loadedRequested) {
    const p = presets.find((x) => x.id === requested);
    if (p) {
      setLoadedRequested(requested);
      draft.update({
        presetId: p.id,
        presetName: p.name,
        type: p.type,
        recipe: structuredClone(p.recipe),
      });
    }
  }

  const setRecipe = (patch: Partial<Recipe>) =>
    draft.update((d) => ({ ...d, recipe: { ...d.recipe, ...patch } }));
  const setPref = (p: Preferment) => setRecipe({ preferment: p });
  const hasPref = r.preferment.kind !== 'none';

  const presetOptions = presets.map((p) => ({ value: p.id, label: p.name }));
  const prefOptions = [
    { value: 'none', label: es.preferments.none },
    ...preferments.map((p) => ({ value: p.id, label: p.name })),
  ];

  const pickPreset = (id: string) => {
    const p = presets.find((x) => x.id === id);
    if (p)
      draft.update({
        presetId: p.id,
        presetName: p.name,
        type: p.type,
        recipe: structuredClone(p.recipe),
      });
  };
  const pickPref = (id: string) => {
    if (id === 'none') return setPref({ ...r.preferment, kind: 'none' });
    const saved = preferments.find((p) => p.id === id);
    if (saved) setPref(prefermentFrom(saved));
  };

  const saveAsBake = () => {
    const prefill: EditorPrefill = { type: s.type, recipe: r, name: s.presetName };
    navigate('/new', { state: { prefill } });
  };

  const openSavePreset = () => {
    setPresetName(s.presetName);
    setPresetType(s.type);
    setSaving(true);
  };

  const confirmSavePreset = () => {
    const name = presetName.trim();
    if (!name) return;
    const existing = presets.find((p) => p.name.trim().toLowerCase() === name.toLowerCase());
    const id = existing?.id ?? newPresetId();
    savePreset({ id, name, type: presetType, recipe: r });
    draft.update((d) => ({ ...d, presetId: id, presetName: name, type: presetType }));
    setSaving(false);
    toast.show(es.calculator.presetSaved);
  };

  const yeastSub = hasPref
    ? es.recipe.yeastFinalSub(es.recipe.yeastKinds[r.yeast.kind])
    : es.recipe.yeastKinds[r.yeast.kind];

  return (
    <div className="page calculator">
      <PageHead title={es.calculator.title} />

      {presets.length > 0 && (
        <div className="calc-presets">
          <span className="field-label" id="preset-label">
            {es.calculator.startFrom}
          </span>
          <div className="calc-presets__row">
            <Tabs
              label={es.calculator.startFrom}
              value={s.presetId ?? ''}
              onChange={pickPreset}
              options={presetOptions}
              size="lg"
            />
            <Link to="/settings" className="small-link">
              {es.calculator.myPresets}
            </Link>
          </div>
        </div>
      )}

      <section className="form-section" aria-labelledby="calc-pref-t">
        <h2 id="calc-pref-t" className="h2 h2--sm">
          {es.preferments.sectionTitle}
        </h2>
        <Tabs
          label={es.preferments.pickerLabel}
          value={prefKey(r.preferment)}
          onChange={pickPref}
          options={prefOptions}
          className="tabs--ruled"
        />
        {hasPref ? (
          <PrefermentParams value={r.preferment} onChange={setPref} compact />
        ) : (
          <p className="hint">{es.preferments.directDough}</p>
        )}
      </section>

      <section className="form-section" aria-labelledby="calc-dough-t">
        <h2 id="calc-dough-t" className="h2 h2--sm">
          {es.calculator.dough}
        </h2>
        <div className="steppers steppers--ruled">
          <Stepper
            label={es.recipe.hydration}
            sub={es.recipe.hydrationSub}
            value={r.hydration}
            onChange={(v) => setRecipe({ hydration: v })}
            min={30}
            max={150}
            unit="%"
            accent
          />
          <Stepper
            label={es.recipe.salt}
            sub={es.recipe.saltSub}
            value={r.salt}
            onChange={(v) => setRecipe({ salt: v })}
            step={0.1}
            max={10}
            unit="%"
          />
          <label className="select-row">
            <span className="stepper__label">{es.recipe.yeastKind}</span>
            <select
              className="input-line"
              value={r.yeast.kind}
              onChange={(e) => {
                const kind = e.target.value as YeastKind;
                setRecipe({ yeast: { kind, pct: convertYeast(r.yeast.pct, r.yeast.kind, kind) } });
              }}
            >
              {YEAST_KINDS.map((k) => (
                <option key={k} value={k}>
                  {es.recipe.yeastKinds[k]}
                </option>
              ))}
            </select>
          </label>
          {r.yeast.kind !== 'none' && (
            <Stepper
              label={es.recipe.yeast}
              sub={yeastSub}
              value={r.yeast.pct}
              onChange={(v) => setRecipe({ yeast: { ...r.yeast, pct: v } })}
              step={adaptiveStep}
              decimals={2}
              unit="%"
            />
          )}
          <Stepper
            label={es.recipe.pieces}
            sub={es.recipe.piecesSub(r.pieces)}
            value={r.pieces}
            onChange={(v) => setRecipe({ pieces: Math.max(1, Math.round(v)) })}
            min={1}
            decimals={0}
          />
          <Stepper
            label={es.recipe.pieceWeight}
            sub={es.recipe.pieceWeightSub}
            value={r.pieceWeight}
            onChange={(v) => setRecipe({ pieceWeight: v })}
            step={10}
            min={10}
            decimals={0}
            unit="g"
          />
        </div>
      </section>

      <section className="form-section" aria-labelledby="res-t">
        <div className="section-head">
          <h2 id="res-t" className="h2 h2--lg">
            {es.calculator.weighThis}
          </h2>
          <span className="hint hint--inline">
            {es.calculator.summary(r.pieces, formatGrams(r.pieceWeight))}
          </span>
        </div>
        <WeighList recipe={r} />
      </section>

      <div className="calc-actions">
        <button type="button" className="btn btn--primary btn--block" onClick={saveAsBake}>
          <IconBookmark size={20} />
          {es.calculator.saveAsBake}
        </button>
        {saving ? (
          <div className="save-preset">
            <label className="field">
              <span className="field-label">{es.calculator.presetName}</span>
              <input
                className="input-title input-title--sm"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                autoFocus
              />
            </label>
            <TypeField value={presetType} onChange={setPresetType} />
            <div className="confirm__actions">
              <button type="button" className="btn btn--ghost" onClick={() => setSaving(false)}>
                {es.common.cancel}
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={confirmSavePreset}
                disabled={!presetName.trim()}
              >
                {es.common.save}
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="link-btn" onClick={openSavePreset}>
            {s.presetId && s.presetName
              ? es.calculator.updatePreset(s.presetName)
              : es.calculator.savePreset}
          </button>
        )}
      </div>
    </div>
  );
}
