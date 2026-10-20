import { useId } from 'react';
import { es } from '../i18n/es';
import { IconMinus, IconPlus } from './Icons';
import { NumberField } from './NumberField';

interface Props {
  label: string;
  sub?: string;
  value: number;
  onChange: (v: number) => void;
  /** Fixed step, or a function of the current value and direction. */
  step?: number | ((v: number, dir: 1 | -1) => number);
  min?: number;
  max?: number;
  decimals?: number;
  unit?: string;
  accent?: boolean;
}

const round = (v: number) => Math.round(v * 1000) / 1000;

/** Row with label, − value + controls. The value is also typeable. */
export function Stepper({
  label,
  sub,
  value,
  onChange,
  step = 1,
  min = 0,
  max,
  decimals = 1,
  unit,
  accent,
}: Props) {
  const id = useId();
  const stepFor = (dir: 1 | -1) => (typeof step === 'function' ? step(value, dir) : step);
  const clamp = (v: number) => Math.min(max ?? Infinity, Math.max(min, v));
  const bump = (dir: 1 | -1) => onChange(clamp(round(value + dir * stepFor(dir))));

  return (
    <div className="stepper" role="group" aria-labelledby={id}>
      <span className="stepper__text">
        <span className="stepper__label" id={id}>
          {label}
        </span>
        {sub && <span className="stepper__sub">{sub}</span>}
      </span>
      <span className="stepper__controls">
        <button
          type="button"
          className="round-btn"
          aria-label={es.common.decrease(label)}
          onClick={() => bump(-1)}
          disabled={value <= min}
        >
          <IconMinus size={18} />
        </button>
        <span className={`stepper__value${accent ? ' stepper__value--accent' : ''}`}>
          <NumberField
            value={value}
            onChange={(v) => onChange(v ?? min)}
            decimals={decimals}
            min={min}
            max={max}
            aria-label={label}
            className="stepper__input"
          />
          {unit && <span className="stepper__unit">{unit}</span>}
        </span>
        <button
          type="button"
          className="round-btn"
          aria-label={es.common.increase(label)}
          onClick={() => bump(1)}
          disabled={max != null && value >= max}
        >
          <IconPlus size={18} />
        </button>
      </span>
    </div>
  );
}
