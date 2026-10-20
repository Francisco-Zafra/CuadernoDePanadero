import { useState } from 'react';
import { newStep } from '../domain/defaults';
import { formatDuration } from '../domain/format';
import { moveStep, totalDurationMin } from '../domain/process';
import type { ProcessStep, ProcessStepKind } from '../domain/types';
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
                <div className="step-edit__fields">
                  <DurationField
                    value={s.durationMin}
                    onChange={(v) => update(s.id, { durationMin: v })}
                    label={name}
                  />
                  <label className="field step-edit__temp">
                    <span className="field-label">{es.process.temp}</span>
                    <NumberField
                      className="input-line"
                      value={s.tempC}
                      onChange={(v) => update(s.id, { tempC: v })}
                      allowEmpty
                      decimals={1}
                    />
                  </label>
                  <label className="field step-edit__note">
                    <span className="field-label">{es.process.note}</span>
                    <input
                      className="input-line"
                      value={s.note}
                      onChange={(e) => update(s.id, { note: e.target.value })}
                    />
                  </label>
                </div>
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

/** Hours + minutes inputs for a duration stored in minutes. */
function DurationField({
  value,
  onChange,
  label,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  label: string;
}) {
  const h = value == null ? null : Math.floor(value / 60);
  const m = value == null ? null : Math.round(value % 60);
  const emit = (hours: number | null, mins: number | null) =>
    onChange(hours == null && mins == null ? null : (hours ?? 0) * 60 + (mins ?? 0));
  return (
    <fieldset className="field duration">
      <legend className="field-label">{es.process.durationLabel}</legend>
      <span className="duration__inputs">
        <NumberField
          className="input-line num"
          aria-label={`${label}: ${es.process.hours}`}
          value={h}
          onChange={(v) => emit(v, m)}
          allowEmpty
          decimals={0}
          min={0}
        />
        <span className="duration__unit">h</span>
        <NumberField
          className="input-line num"
          aria-label={`${label}: ${es.process.minutes}`}
          value={m}
          onChange={(v) => emit(h, v)}
          allowEmpty
          decimals={0}
          min={0}
        />
        <span className="duration__unit">min</span>
      </span>
    </fieldset>
  );
}
