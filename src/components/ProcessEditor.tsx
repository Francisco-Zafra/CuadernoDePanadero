import { useId, useState } from 'react';
import { newStep } from '../domain/defaults';
import { formatDuration } from '../domain/format';
import {
  STEP_FIELDS,
  bakeStages,
  foldsDurationMin,
  moveStep,
  stagesDurationMin,
  totalDurationMin,
} from '../domain/process';
import type { BakeStage, ProcessStep, ProcessStepKind } from '../domain/types';
import { es } from '../i18n/es';
import { IconArrowDown, IconArrowUp, IconClose, IconPlus } from './Icons';
import { NumberField } from './NumberField';

const ADDABLE: ProcessStepKind[] = [
  'autolyse',
  'mix',
  'folds',
  'bulk',
  'cold',
  'shape',
  'proof',
  'bake',
  'other',
];

interface Props {
  steps: ProcessStep[];
  onChange: (steps: ProcessStep[]) => void;
}

/** Steps that can be added, removed and reordered. The preferment step stays first. */
export function ProcessEditor({ steps, onChange }: Props) {
  const [kindToAdd, setKindToAdd] = useState<ProcessStepKind>('mix');
  const update = (id: string, patch: Partial<ProcessStep>) =>
    onChange(steps.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const total = totalDurationMin(steps);

  return (
    <div className="process-editor">
      {total != null && <p className="section-lead">{es.process.total(formatDuration(total))}</p>}
      <ol className="steps-edit">
        {steps.map((s, i) => {
          const isPref = s.kind === 'preferment';
          const name = s.label || es.process.kinds[s.kind];
          return (
            <li key={s.id} className="step-edit">
              <div className="step-edit__head">
                <span className="step-edit__num" aria-hidden="true">
                  {i + 1}.
                </span>
                {isPref ? (
                  <span className="step-edit__fixed">
                    <span className="eyebrow eyebrow--crust">{es.process.prefTag}</span>
                    <span className="step-edit__name">{name}</span>
                  </span>
                ) : (
                  <input
                    className="input-line step-edit__label"
                    aria-label={`${es.process.stepLabel} ${i + 1}`}
                    value={s.label}
                    placeholder={es.process.kinds[s.kind]}
                    onChange={(e) => update(s.id, { label: e.target.value })}
                  />
                )}
                {!isPref && (
                  <span className="step-edit__tools">
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={es.process.moveUp(name)}
                      onClick={() => onChange(moveStep(steps, i, -1))}
                      disabled={i === 0 || steps[i - 1]?.kind === 'preferment'}
                    >
                      <IconArrowUp size={18} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={es.process.moveDown(name)}
                      onClick={() => onChange(moveStep(steps, i, 1))}
                      disabled={i === steps.length - 1}
                    >
                      <IconArrowDown size={18} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn icon-btn--danger"
                      aria-label={es.process.removeStep(name)}
                      onClick={() => onChange(steps.filter((x) => x.id !== s.id))}
                    >
                      <IconClose size={18} />
                    </button>
                  </span>
                )}
              </div>
              {isPref ? (
                <p className="hint step-edit__hint">
                  {[formatDuration(s.durationMin), s.tempC != null ? `${s.tempC} °C` : null]
                    .filter(Boolean)
                    .join(' · ')}{' '}
                  · {es.process.prefStepHint}
                </p>
              ) : (
                <StepFieldsEditor step={s} name={name} onChange={(p) => update(s.id, p)} />
              )}
            </li>
          );
        })}
      </ol>
      <div className="add-step">
        <label className="field add-step__kind">
          <span className="field-label">{es.process.stepKind}</span>
          <select
            className="input-line"
            value={kindToAdd}
            onChange={(e) => setKindToAdd(e.target.value as ProcessStepKind)}
          >
            {ADDABLE.map((k) => (
              <option key={k} value={k}>
                {es.process.kinds[k]}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="link-btn"
          onClick={() => onChange([...steps, newStep(kindToAdd)])}
        >
          <IconPlus size={18} />
          {es.process.addStep}
        </button>
      </div>
    </div>
  );
}

/** Only the values that make sense for the step's kind, on one line, plus a short note. */
function StepFieldsEditor({
  step: s,
  name,
  onChange,
}: {
  step: ProcessStep;
  name: string;
  onChange: (patch: Partial<ProcessStep>) => void;
}) {
  const fields = s.kind === 'preferment' ? null : STEP_FIELDS[s.kind];
  if (!fields) return null;
  const temp = fields.temp && (
    <>
      {fields.duration && <span className="step-edit__unit">{es.process.tempAt}</span>}
      <SmallNumber
        label={`${name}: ${es.process.temp}`}
        value={s.tempC}
        onChange={(tempC) => onChange({ tempC })}
        decimals={1}
      />
      <span className="step-edit__unit">°C</span>
    </>
  );

  return (
    <div className="step-edit__body">
      {fields.stages ? (
        <StagesEditor step={s} name={name} onChange={onChange} />
      ) : (
        (fields.duration || fields.temp || fields.folds) && (
          <div className="step-edit__line">
            {fields.folds && <FoldsInputs step={s} name={name} onChange={onChange} />}
            {fields.duration && (
              <DurationInputs
                value={s.durationMin}
                onChange={(durationMin) => onChange({ durationMin })}
                label={name}
                hours={fields.duration === 'hm'}
              />
            )}
            {temp}
          </div>
        )
      )}
      <input
        className="input-line step-edit__note"
        aria-label={`${name}: ${es.process.note}`}
        placeholder={es.process.note}
        value={s.note}
        onChange={(e) => onChange({ note: e.target.value })}
      />
    </div>
  );
}

function SmallNumber({
  label,
  value,
  onChange,
  decimals = 0,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  decimals?: number;
}) {
  return (
    <NumberField
      className="input-line num step-edit__num-input"
      aria-label={label}
      value={value}
      onChange={onChange}
      allowEmpty
      decimals={decimals}
      min={0}
    />
  );
}

/** "3 cada 20 min": the step's duration follows from both. */
function FoldsInputs({
  step: s,
  name,
  onChange,
}: {
  step: ProcessStep;
  name: string;
  onChange: (patch: Partial<ProcessStep>) => void;
}) {
  const count = s.foldCount ?? null;
  const every = s.foldEveryMin ?? null;
  const emit = (foldCount: number | null, foldEveryMin: number | null) =>
    onChange({
      foldCount,
      foldEveryMin,
      durationMin:
        foldCount == null && foldEveryMin == null
          ? null
          : (foldsDurationMin(foldCount, foldEveryMin) ?? s.durationMin),
    });
  const total = foldsDurationMin(count, every);
  return (
    <>
      <SmallNumber
        label={`${name}: ${es.process.foldCount}`}
        value={count}
        onChange={(v) => emit(v == null ? null : Math.round(v), every)}
      />
      <span className="step-edit__unit">{es.process.foldsEvery}</span>
      <SmallNumber
        label={`${name}: ${es.process.foldEvery}`}
        value={every}
        onChange={(v) => emit(count, v)}
      />
      <span className="step-edit__unit">min</span>
      {total != null && <span className="step-edit__total">= {formatDuration(total)}</span>}
    </>
  );
}

/** Bake stretches: "20 min a 230 °C, tapa cerrada", as many as needed. */
function StagesEditor({
  step: s,
  name,
  onChange,
}: {
  step: ProcessStep;
  name: string;
  onChange: (patch: Partial<ProcessStep>) => void;
}) {
  const listId = useId();
  const stages = bakeStages(s);
  // The stretches carry the temperatures; the step's own one stays empty.
  const emit = (next: BakeStage[]) =>
    onChange({ stages: next, durationMin: stagesDurationMin(next), tempC: null });
  const set = (i: number, patch: Partial<BakeStage>) =>
    emit(stages.map((st, j) => (j === i ? { ...st, ...patch } : st)));

  return (
    <>
      <datalist id={listId}>
        {es.process.stageNoteHints.map((h) => (
          <option key={h} value={h} />
        ))}
      </datalist>
      <ol className="stages">
        {stages.map((st, i) => (
          <li key={i} className="step-edit__line">
            <SmallNumber
              label={`${name} ${i + 1}: ${es.process.minutes}`}
              value={st.min}
              onChange={(min) => set(i, { min })}
            />
            <span className="step-edit__unit">min {es.process.tempAt}</span>
            <SmallNumber
              label={`${name} ${i + 1}: ${es.process.temp}`}
              value={st.tempC}
              onChange={(tempC) => set(i, { tempC })}
            />
            <span className="step-edit__unit">°C</span>
            <input
              className="input-line stages__note"
              aria-label={`${name} ${i + 1}: ${es.process.stageNote}`}
              placeholder={i === 0 ? es.process.stageNoteHints[0] : es.process.stageNoteHints[1]}
              list={listId}
              value={st.note}
              onChange={(e) => set(i, { note: e.target.value })}
            />
            {stages.length > 1 && (
              <button
                type="button"
                className="icon-btn"
                aria-label={es.process.removeStage(i + 1)}
                onClick={() => emit(stages.filter((_, j) => j !== i))}
              >
                <IconClose size={16} />
              </button>
            )}
          </li>
        ))}
      </ol>
      <button
        type="button"
        className="link-btn link-btn--sm"
        onClick={() => emit([...stages, { min: null, tempC: null, note: '' }])}
      >
        <IconPlus size={16} />
        {es.process.addStage}
      </button>
    </>
  );
}

/** Minutes, or hours + minutes, for a duration stored in minutes. */
function DurationInputs({
  value,
  onChange,
  label,
  hours,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  label: string;
  hours: boolean;
}) {
  if (!hours)
    return (
      <>
        <SmallNumber label={`${label}: ${es.process.minutes}`} value={value} onChange={onChange} />
        <span className="step-edit__unit">min</span>
      </>
    );
  const h = value == null ? null : Math.floor(value / 60);
  const m = value == null ? null : Math.round(value % 60);
  const emit = (hh: number | null, mm: number | null) =>
    onChange(hh == null && mm == null ? null : (hh ?? 0) * 60 + (mm ?? 0));
  return (
    <>
      <SmallNumber label={`${label}: ${es.process.hours}`} value={h} onChange={(v) => emit(v, m)} />
      <span className="step-edit__unit">h</span>
      <SmallNumber
        label={`${label}: ${es.process.minutes}`}
        value={m}
        onChange={(v) => emit(h, v)}
      />
      <span className="step-edit__unit">min</span>
    </>
  );
}
