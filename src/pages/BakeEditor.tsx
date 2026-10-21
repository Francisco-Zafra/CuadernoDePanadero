import { useCallback, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { PhotosStep } from '../components/PhotosStep';
import type { NewCustom } from '../components/PrefermentPicker';
import { ProcessEditor } from '../components/ProcessEditor';
import { RatingInput } from '../components/Rating';
import { RecipeEditor } from '../components/RecipeEditor';
import { useToast } from '../components/Toast';
import { TypeField } from '../components/TypeField';
import { newBakeId, saveBake } from '../data/bakesRepo';
import { errorMessage } from '../data/errors';
import { blankBake } from '../domain/defaults';
import { fromDateInput, toDateInput } from '../domain/format';
import { syncPrefermentStep } from '../domain/process';
import type { Bake, BakeInput, BakeType, Recipe } from '../domain/types';
import { useUid } from '../hooks/useAuth';
import { useBake } from '../hooks/useBake';
import { useCatalog } from '../hooks/useCatalog';
import { useDraft } from '../hooks/useDraft';
import { usePhotoEditing } from '../hooks/usePhotoEditing';
import { es } from '../i18n/es';

export type EditorMode = 'new' | 'edit' | 'repeat';

/** Prefill passed through router state (e.g. from the calculator). */
export interface EditorPrefill {
  name?: string;
  type: BakeType;
  recipe: Recipe;
}

const toInput = ({ id: _id, updatedAt: _u, ...rest }: Bake): BakeInput => rest;

/** "Repetir": same recipe and process, today's date, no photos and no rating. */
function repeatOf(b: Bake): BakeInput {
  return {
    ...toInput(b),
    date: new Date(),
    createdAt: undefined,
    status: 'complete',
    rating: null,
    notes: '',
    photoIds: [],
    coverPhotoId: null,
    thumb: null,
    sourceBakeId: b.id,
  };
}

export function BakeEditor({ mode }: { mode: EditorMode }) {
  const { id } = useParams();
  const { bake, loading } = useBake(mode === 'new' ? undefined : id);
  const location = useLocation();
  const navState = location.state as { prefill?: EditorPrefill; step?: number } | null;
  const prefill = navState?.prefill;

  if (mode !== 'new' && loading) return null;
  if (mode !== 'new' && !bake) {
    return (
      <div className="page">
        <p className="notice">{es.errors.notFound}</p>
        <Link to="/" className="text-link">
          {es.detail.back}
        </Link>
      </div>
    );
  }

  let initial: BakeInput;
  if (mode === 'edit') initial = toInput(bake!);
  else if (mode === 'repeat') initial = repeatOf(bake!);
  else if (prefill) {
    initial = {
      ...blankBake(prefill.type),
      name: prefill.name ?? '',
      recipe: prefill.recipe,
      process: syncPrefermentStep([], prefill.recipe.preferment),
    };
  } else initial = blankBake();

  const key = mode === 'new' ? 'new' : `${mode}:${bake!.id}`;
  return (
    <EditorForm
      key={key}
      draftKey={key}
      mode={mode}
      initial={initial}
      bake={mode === 'edit' ? bake! : null}
      source={mode === 'repeat' ? bake! : null}
      ignoreDraft={!!prefill}
      startStep={navState?.step ?? 0}
    />
  );
}

interface DraftState {
  bake: BakeInput;
  step: number;
  newCustom: NewCustom | null;
}

const reviveDraft = (d: DraftState): DraftState => ({
  ...d,
  bake: {
    ...d.bake,
    date: new Date(d.bake.date),
    createdAt: d.bake.createdAt ? new Date(d.bake.createdAt) : undefined,
  },
});

function EditorForm({
  draftKey,
  mode,
  initial,
  bake,
  source,
  ignoreDraft,
  startStep,
}: {
  draftKey: string;
  mode: EditorMode;
  initial: BakeInput;
  bake: Bake | null;
  source: Bake | null;
  ignoreDraft: boolean;
  startStep: number;
}) {
  const uid = useUid();
  const navigate = useNavigate();
  const toast = useToast();
  const catalog = useCatalog();
  const initialState = useCallback(
    (): DraftState => ({ bake: initial, step: startStep, newCustom: null }),
    [initial, startStep],
  );
  const draft = useDraft<DraftState>(draftKey, initialState, reviveDraft, ignoreDraft);
  const { bake: value, step, newCustom } = draft.value;
  const [nameError, setNameError] = useState(false);
  const photos = usePhotoEditing(uid, bake);

  const setState = (patch: Partial<DraftState>) => draft.update((d) => ({ ...d, ...patch }));
  const set = <K extends keyof BakeInput>(k: K, v: BakeInput[K]) =>
    draft.update((d) => ({ ...d, bake: { ...d.bake, [k]: v } }));
  const setRecipe = (recipe: Recipe) =>
    draft.update((d) => ({
      ...d,
      bake: { ...d.bake, recipe, process: syncPrefermentStep(d.bake.process, recipe.preferment) },
    }));
  const goTo = (s: number) => {
    setState({ step: s });
    window.scrollTo(0, 0);
  };

  const steps = es.editor.steps;
  const last = steps.length - 1;
  const title =
    mode === 'edit'
      ? es.editor.editTitle
      : mode === 'repeat'
        ? es.editor.repeatTitle
        : es.editor.newTitle;
  const cancelTo = bake ? `/bake/${bake.id}` : source ? `/bake/${source.id}` : '/';

  const save = () => {
    const name = value.name.trim();
    if (!name) {
      setNameError(true);
      goTo(0);
      return;
    }
    const id = bake?.id ?? newBakeId(uid);
    const pref = value.recipe.preferment;
    if (newCustom?.save && pref.kind === 'custom' && pref.customId === newCustom.id) {
      catalog.savePreferment({
        id: newCustom.id,
        name: pref.name?.trim() || es.preferments.newName,
        flourPct: pref.flourPct,
        hydration: pref.hydration,
        yeastPct: pref.yeastPct,
        hours: pref.hours,
        tempC: pref.tempC,
      });
    }
    const { changes, photoIds, coverPhotoId, thumb } = photos.result(value);
    saveBake(
      uid,
      id,
      { ...value, name, status: 'complete', photoIds, coverPhotoId, thumb },
      changes,
    ).catch((err) => toast.error(errorMessage(err)));
    draft.clear();
    toast.show(es.editor.saved);
    navigate(`/bake/${id}`, { replace: true });
  };

  return (
    <div className="editor">
      <header className="editor__bar">
        <Link to={cancelTo} className="bar-link" onClick={() => draft.clear()}>
          {es.common.cancel}
        </Link>
        <span className="editor__bar-title">{title}</span>
        {mode === 'new' ? (
          <Link to="/new/quick" className="bar-link bar-link--accent">
            {es.editor.quickMode}
          </Link>
        ) : (
          <button type="button" className="bar-link bar-link--accent" onClick={save}>
            {es.common.save}
          </button>
        )}
      </header>

      <nav aria-label={es.editor.progress} className="progress">
        <ol className="progress__list">
          {steps.map((label, i) => (
            <li key={label}>
              <button
                type="button"
                className={`progress__step${i < step ? ' is-done' : ''}`}
                aria-current={i === step ? 'step' : undefined}
                onClick={() => goTo(i)}
              >
                <span className="progress__bar" aria-hidden="true" />
                <span className="progress__label">{label}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className="page editor__body">
        {draft.restored && (
          <p className="draft-note" role="status">
            {es.editor.draftRestored}{' '}
            <button type="button" className="link-btn" onClick={draft.discard}>
              {es.editor.discardDraft}
            </button>
          </p>
        )}
        {source && step === 0 && <p className="hint">{es.editor.repeatedFrom(source.name)}</p>}

        {step === 1 ? (
          // The recipe step goes straight to the form; the progress bar already names it.
          <h1 className="sr-only">{steps[step]}</h1>
        ) : (
          <div className="step-head">
            <p className="step-kicker">{es.editor.stepOf(step + 1, steps.length)}</p>
            <h1 className="step-title">{step === 0 ? es.editor.basicTitle : steps[step]}</h1>
            {step === 0 && <p className="step-lead">{es.editor.basicLead}</p>}
            {step === 2 && <p className="step-lead">{es.process.lead}</p>}
            {step === 3 && <p className="step-lead">{es.photos.lead}</p>}
          </div>
        )}

        {step === 0 && (
          <BasicStep
            value={value}
            set={set}
            nameError={nameError}
            clearNameError={() => setNameError(false)}
            canPickPreset={mode === 'new'}
            onPreset={(type, recipe) =>
              draft.update((d) => ({
                ...d,
                bake: {
                  ...d.bake,
                  type,
                  recipe,
                  process: syncPrefermentStep(d.bake.process, recipe.preferment),
                },
              }))
            }
          />
        )}
        {step === 1 && (
          <RecipeEditor
            recipe={value.recipe}
            onChange={setRecipe}
            newCustom={newCustom}
            onNewCustomChange={(c) => setState({ newCustom: c })}
          />
        )}
        {step === 2 && <ProcessEditor steps={value.process} onChange={(p) => set('process', p)} />}
        {step === 3 && <PhotosStep editing={photos} type={value.type} />}
        {step === 4 && (
          <div className="form-stack">
            <RatingInput value={value.rating} onChange={(r) => set('rating', r)} />
            <label className="field">
              <span className="field-label">{es.result.notes}</span>
              <textarea
                className="ruled-input"
                rows={4}
                value={value.notes}
                placeholder={es.result.notesPlaceholder}
                onChange={(e) => set('notes', e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field-label">{es.result.nextTime}</span>
              <textarea
                className="ruled-input"
                rows={3}
                value={value.nextTime}
                placeholder={es.result.nextTimePlaceholder}
                onChange={(e) => set('nextTime', e.target.value)}
              />
            </label>
          </div>
        )}
      </div>

      <div className="editor__footer">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => goTo(step - 1)}
          disabled={step === 0}
        >
          {es.editor.prev}
        </button>
        {step < last ? (
          <button type="button" className="btn btn--primary" onClick={() => goTo(step + 1)}>
            {es.editor.next(steps[step + 1]!)}
          </button>
        ) : (
          <button type="button" className="btn btn--primary" onClick={save}>
            {es.editor.saveBake}
          </button>
        )}
      </div>
    </div>
  );
}

function BasicStep({
  value,
  set,
  nameError,
  clearNameError,
  canPickPreset,
  onPreset,
}: {
  value: BakeInput;
  set: <K extends keyof BakeInput>(k: K, v: BakeInput[K]) => void;
  nameError: boolean;
  clearNameError: () => void;
  canPickPreset: boolean;
  onPreset: (type: BakeType, recipe: Recipe) => void;
}) {
  const { presets } = useCatalog();
  const [presetId, setPresetId] = useState('');
  return (
    <div className="form-stack">
      <label className="field">
        <span className="field-label">{es.editor.name}</span>
        <input
          className="input-title"
          value={value.name}
          placeholder={es.editor.namePlaceholder}
          aria-invalid={nameError || undefined}
          onChange={(e) => {
            set('name', e.target.value);
            clearNameError();
          }}
        />
        {nameError && <span className="field-error">{es.editor.nameRequired}</span>}
      </label>
      <TypeField value={value.type} onChange={(t) => set('type', t)} />
      <label className="field">
        <span className="field-label">{es.editor.date}</span>
        <input
          type="date"
          className="input-line"
          value={toDateInput(value.date)}
          onChange={(e) => {
            const d = fromDateInput(e.target.value);
            if (d) set('date', d);
          }}
        />
      </label>
      {canPickPreset && presets.length > 0 && (
        <label className="field">
          <span className="field-label">{es.editor.fromPreset}</span>
          <select
            className="input-line"
            value={presetId}
            onChange={(e) => {
              setPresetId(e.target.value);
              const p = presets.find((x) => x.id === e.target.value);
              if (p) onPreset(p.type, structuredClone(p.recipe));
            }}
          >
            <option value="">{es.editor.fromPresetNone}</option>
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
