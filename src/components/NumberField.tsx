import { useState, type InputHTMLAttributes } from 'react';
import { formatNumber, parseDecimal } from '../domain/format';

type Props = {
  value: number | null;
  onChange: (value: number | null) => void;
  /** Max decimals shown when not editing. */
  decimals?: number;
  min?: number;
  max?: number;
  /** Allow clearing the field (value becomes null). */
  allowEmpty?: boolean;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type' | 'min' | 'max'>;

const clamp = (v: number, min?: number, max?: number) =>
  Math.min(max ?? Infinity, Math.max(min ?? -Infinity, v));

/**
 * Numeric text field: decimal keyboard on mobile, accepts "," or ".",
 * shows the es-ES formatted value when not focused.
 */
export function NumberField({
  value,
  onChange,
  decimals = 2,
  min,
  max,
  allowEmpty = false,
  onFocus,
  onBlur,
  ...rest
}: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const shown = editing ?? (value == null ? '' : formatNumber(value, decimals));

  return (
    <input
      {...rest}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={shown}
      onFocus={(e) => {
        setEditing(value == null ? '' : formatNumber(value, 4));
        e.currentTarget.select();
        onFocus?.(e);
      }}
      onChange={(e) => {
        const text = e.target.value;
        setEditing(text);
        const n = parseDecimal(text);
        if (n != null) onChange(clamp(n, min, undefined));
        else if (text.trim() === '' && allowEmpty) onChange(null);
      }}
      onBlur={(e) => {
        setEditing(null);
        if (value != null) {
          const c = clamp(value, min, max);
          if (c !== value) onChange(c);
        } else if (!allowEmpty) {
          onChange(clamp(0, min, max));
        }
        onBlur?.(e);
      }}
    />
  );
}
