import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { IconIncomplete } from '../components/Icons';
import { QuickPhoto, useQuickPhoto } from '../components/QuickPhoto';
import { useToast } from '../components/Toast';
import { TypeField } from '../components/TypeField';
import { newBakeId, saveBake } from '../data/bakesRepo';
import { errorMessage } from '../data/errors';
import { blankBake, emptyRecipe } from '../domain/defaults';
import type { BakeType } from '../domain/types';
import { useUid } from '../hooks/useAuth';
import { useDraft } from '../hooks/useDraft';
import { es } from '../i18n/es';

interface QuickDraft {
  name: string;
  type: BakeType;
  note: string;
}

/** Quick note with the hands in the dough: name, type, photo and a note → incomplete. */
export function QuickBake() {
  const uid = useUid();
  const navigate = useNavigate();
  const toast = useToast();
  const initial = useCallback((): QuickDraft => ({ name: '', type: 'bread', note: '' }), []);
  const draft = useDraft<QuickDraft>('quick', initial);
  const { name, type, note } = draft.value;
  const [nameError, setNameError] = useState(false);
  const photo = useQuickPhoto();
  const set = (patch: Partial<QuickDraft>) => draft.update((d) => ({ ...d, ...patch }));

  const save = () => {
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    const id = newBakeId(uid);
    const added = photo.newPhoto ? [photo.newPhoto] : [];
    saveBake(
      uid,
      id,
      {
        ...blankBake(type),
        name: name.trim(),
        type,
        status: 'incomplete',
        recipe: emptyRecipe(type),
        notes: note,
        photoIds: added.map((p) => p.id),
        coverPhotoId: added[0]?.id ?? null,
        thumb: added[0]?.thumb ?? null,
      },
      { added, removedIds: [], tagChanges: {} },
    ).catch((err) => toast.error(errorMessage(err)));
    draft.clear();
    toast.show(es.editor.saved);
    navigate(`/bake/${id}`, { replace: true });
  };

  return (
    <div className="editor">
      <header className="editor__bar editor__bar--split">
        <Link to="/" className="bar-link" onClick={() => draft.clear()}>
          {es.common.cancel}
        </Link>
        <Link to="/new" className="bar-link bar-link--accent">
          {es.editor.fullForm}
        </Link>
      </header>
      <div className="page editor__body">
        <div className="step-head">
          <h1 className="step-title">{es.editor.quickTitle}</h1>
          <p className="step-lead">{es.editor.quickLead}</p>
        </div>
        <label className="field">
          <span className="field-label">{es.editor.name}</span>
          <input
            className="input-title"
            value={name}
            aria-invalid={nameError || undefined}
            onChange={(e) => {
              set({ name: e.target.value });
              setNameError(false);
            }}
          />
          {nameError && <span className="field-error">{es.editor.nameRequired}</span>}
        </label>
        <TypeField value={type} onChange={(t) => set({ type: t })} />
        <QuickPhoto state={photo} type={type} />
        <label className="field">
          <span className="field-label">{es.editor.note}</span>
          <textarea
            className="ruled-input"
            rows={3}
            value={note}
            onChange={(e) => set({ note: e.target.value })}
          />
        </label>
      </div>
      <div className="editor__footer editor__footer--stack">
        <p className="quick-note">
          <IconIncomplete size={12} />
          {es.editor.quickWillBe} <em className="quick-note__em">{es.journal.incomplete}</em>.
        </p>
        <button type="button" className="btn btn--primary" onClick={save}>
          {es.common.save}
        </button>
      </div>
    </div>
  );
}
