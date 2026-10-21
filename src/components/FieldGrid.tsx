import { useId, type ReactNode } from 'react';
import { NumberField } from './NumberField';

interface FieldProps {
  label: string;
  /** Replaces the visible label (e.g. a select); `label` stays as the input's name. */
  head?: ReactNode;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  decimals?: number;
  min?: number;
  max?: number;
  accent?: boolean;
  disabled?: boolean;
}

/** Compact grid cell: small label over a typeable number with its unit. */
export function FieldCell({
  label,
  head,
  value,
  onChange,
  unit,
  decimals = 1,
  min = 0,
  max,
  accent,
  disabled,
}: FieldProps) {
  const id = useId();
  return (
    <div className={`cell${accent ? ' cell--accent' : ''}`}>
      {head ?? (
        <label htmlFor={id} className="cell__label">
          {label}
        </label>
      )}
      <span className="cell__value">
        <NumberField
          id={id}
          aria-label={head ? label : undefined}
          className="cell__input"
          value={value}
          onChange={(v) => onChange(v ?? min)}
          decimals={decimals}
          min={min}
          max={max}
          disabled={disabled}
        />
        {unit && <span className="cell__unit">{unit}</span>}
      </span>
    </div>
  );
}

/** Read-only grid cell (e.g. Masa total). */
export function OutputCell({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  const id = useId();
  return (
    <div className="cell cell--output">
      <span id={id} className="cell__label">
        {label}
      </span>
      <span className="cell__value">
        <output aria-labelledby={id} aria-live="polite" className="cell__output">
          {value}
        </output>
        {unit && <span className="cell__unit">{unit}</span>}
      </span>
    </div>
  );
}
