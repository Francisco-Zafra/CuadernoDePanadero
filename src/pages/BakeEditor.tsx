import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { RatingInput } from '../components/Rating';
import { useToast } from '../components/Toast';
import { newBakeId, saveBake, type BakeInput } from '../data/bakesRepo';
import { errorMessage } from '../data/errors';
import { emptyRecipe } from '../domain/defaults';
import { fromDateInput, toDateInput } from '../domain/format';
import type { Bake, BakeType } from '../domain/types';
import { useUid } from '../hooks/useAuth';
import { useBake } from '../hooks/useBake';
import { es } from '../i18n/es';

function blankBake(): BakeInput {
  return {
    name: '',
    type: 'bread',
    date: new Date(),
    status: 'complete',
    recipe: emptyRecipe('bread'),
    process: [],
    rating: null,
    notes: '',
    nextTime: '',
    photoIds: [],
    coverPhotoId: null,
    thumb: null,
    sourceBakeId: null,
  };
}

const toInput = ({ id: _id, updatedAt: _u, ...rest }: Bake): BakeInput => rest;

export function BakeEditor({ mode }: { mode: 'new' | 'edit' }) {
  const { id } = useParams();
  const { bake, loading } = useBake(mode === 'edit' ? id : undefined);
  if (mode === 'edit' && loading) return null;
  if (mode === 'edit' && !bake) {
    return (
      <div className="page">
        <p className="notice">{es.errors.notFound}</p>
      </div>
    );
  }
  return (
    <EditorForm
      key={bake?.id ?? 'new'}
      initial={bake ? toInput(bake) : blankBake()}
      bakeId={bake?.id}
    />
  );
}

function EditorForm({ initial, bakeId }: { initial: BakeInput; bakeId?: string }) {
  const uid = useUid();
  const navigate = useNavigate();
  const toast = useToast();
  const [draft, setDraft] = useState<BakeInput>(initial);
  const [nameError, setNameError] = useState(false);
  const set = <K extends keyof BakeInput>(k: K, v: BakeInput[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const save = () => {
    if (!draft.name.trim()) {
      setNameError(true);
      return;
    }
    const id = bakeId ?? newBakeId(uid);
    saveBake(uid, id, { ...draft, name: draft.name.trim() }).catch((err) =>
      toast.error(errorMessage(err)),
    );
    toast.show(es.editor.saved);
    navigate(`/bake/${id}`, { replace: true });
  };

  return (
    <div className="editor">
      <header className="editor__bar">
        <Link to={bakeId ? `/bake/${bakeId}` : '/'} className="bar-link">
          {es.common.cancel}
        </Link>
        <span className="editor__bar-title">
          {bakeId ? es.editor.editTitle : es.editor.newTitle}
        </span>
        <span />
      </header>
      <div className="page editor__body">
        <h1 className="step-title">{es.editor.basicTitle}</h1>
        <label className="field">
          <span className="field-label">{es.editor.name}</span>
          <input
            className="input-title"
            value={draft.name}
            placeholder={es.editor.namePlaceholder}
            aria-invalid={nameError || undefined}
            onChange={(e) => {
              set('name', e.target.value);
              setNameError(false);
            }}
          />
          {nameError && <span className="field-error">{es.editor.nameRequired}</span>}
        </label>
        <TypeField value={draft.type} onChange={(t) => set('type', t)} />
        <label className="field">
          <span className="field-label">{es.editor.date}</span>
          <input
            type="date"
            className="input-line"
            value={toDateInput(draft.date)}
            onChange={(e) => {
              const d = fromDateInput(e.target.value);
              if (d) set('date', d);
            }}
          />
        </label>
        <RatingInput value={draft.rating} onChange={(r) => set('rating', r)} />
        <label className="field">
          <span className="field-label">{es.result.notes}</span>
          <textarea
            className="ruled-input"
            rows={4}
            value={draft.notes}
            placeholder={es.result.notesPlaceholder}
            onChange={(e) => set('notes', e.target.value)}
          />
        </label>
      </div>
      <div className="editor__footer">
        <button type="button" className="btn btn--primary btn--lg btn--block" onClick={save}>
          {es.common.save}
        </button>
      </div>
    </div>
  );
}

export function TypeField({
  value,
  onChange,
}: {
  value: BakeType;
  onChange: (t: BakeType) => void;
}) {
  return (
    <fieldset className="field type-field">
      <legend className="field-label">{es.editor.type}</legend>
      <div className="radio-tabs">
        {(['bread', 'pizza'] as const).map((t) => (
          <label key={t} className="radio-tabs__item">
            <input
              type="radio"
              name="bake-type"
              checked={value === t}
              onChange={() => onChange(t)}
            />
            {es.types[t]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
