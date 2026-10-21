import { useCallback, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { IconBookmark } from '../components/Icons';
import { PageHead } from '../components/PageHead';
import { DoughSection } from '../components/DoughSection';
import { PrefermentPicker } from '../components/PrefermentPicker';
import { Tabs } from '../components/Tabs';
import { useToast } from '../components/Toast';
import { TypeField } from '../components/TypeField';
import { WeighTable } from '../components/WeighTable';
import { resize, totalFlourFor, withFlour, type SizeBy } from '../domain/bakersMath';
import { DEFAULT_PRESETS } from '../domain/defaults';
import { formatGrams } from '../domain/format';
import type { BakeType, Preferment, Preset, Recipe } from '../domain/types';
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
  /** Size the dough by total flour or by piece weight. */
  sizeBy?: SizeBy;
}

export function Calculator() {
  const { presets, savePreset, newPresetId } = useCatalog();
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  const initial = useCallback((): CalcState => {
    const p = DEFAULT_PRESETS[2]!;
    const { yeast } = p.recipe;
    const recipe: Recipe = {
      ...structuredClone(p.recipe),
      yeast: { kind: 'instant', pct: convertYeast(yeast.pct, yeast.kind, 'instant') },
    };
    return {
      presetId: null,
      presetName: '',
      type: p.type,
      recipe: withFlour(recipe, Math.round(totalFlourFor(recipe))),
      sizeBy: 'flour',
    };
  }, []);
  const draft = useDraft<CalcState>('calculator:v3', initial);
  const s = draft.value;
  const sizeBy = s.sizeBy ?? 'flour';
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
      loadPreset(p);
    }
  }

  const setPref = (p: Preferment) =>
    draft.update((d) => ({
      ...d,
      recipe: resize(d.recipe, { ...d.recipe, preferment: p }, d.sizeBy ?? 'flour'),
    }));

  const presetOptions = presets.map((p) => ({ value: p.id, label: p.name }));

  // A preset loads exactly as saved, its own size included.
  function loadPreset(p: Preset) {
    draft.update((d) => ({
      ...d,
      presetId: p.id,
      presetName: p.name,
      type: p.type,
      recipe: structuredClone(p.recipe),
    }));
  }
  const pickPreset = (id: string) => {
    const p = presets.find((x) => x.id === id);
    if (p) loadPreset(p);
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

  return (
    <div className="page calculator">
      <PageHead title={es.calculator.title} />

      {presets.length > 0 && (
        <div className="calc-presets">
          <div className="calc-presets__row">
            <Tabs
              label={es.calculator.startFrom}
              value={s.presetId ?? ''}
              onChange={pickPreset}
              options={presetOptions}
            />
            <Link to="/settings" className="small-link">
              {es.calculator.myPresets}
            </Link>
          </div>
        </div>
      )}

      <PrefermentPicker
        id="calc-pref-t"
        headingClassName="section-label"
        value={r.preferment}
        onChange={setPref}
        compact
      />

      <DoughSection
        id="calc-dough-t"
        headingClassName="section-label"
        recipe={r}
        onChange={(recipe) => draft.update((d) => ({ ...d, recipe }))}
        sizeBy={sizeBy}
        onSizeByChange={(v) => draft.update((d) => ({ ...d, sizeBy: v }))}
      />

      <section className="form-section" aria-labelledby="res-t">
        <div className="section-head">
          <h2 id="res-t" className="h2 h2--lg">
            {es.calculator.weighThis}
          </h2>
          <span className="hint hint--inline">
            {es.calculator.summary(r.pieces, formatGrams(r.pieceWeight))}
          </span>
        </div>
        <WeighTable recipe={r} />
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
