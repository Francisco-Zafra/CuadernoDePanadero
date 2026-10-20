// es-ES formatting and lenient number parsing (accepts both "," and ".").

import { roundGrams, type LineKind } from './bakersMath';

const nf = (max: number, min = 0) =>
  new Intl.NumberFormat('es-ES', {
    maximumFractionDigits: max,
    minimumFractionDigits: min,
    useGrouping: false,
  });

const NF0 = nf(0);
const NF1 = nf(1);
const NF1_FIXED = nf(1, 1);
const NF2 = nf(2);

/** Number with up to `decimals` decimals, comma as separator. */
export function formatNumber(n: number, decimals = 1): string {
  if (!Number.isFinite(n)) return '—';
  const f = decimals === 0 ? NF0 : decimals === 1 ? NF1 : NF2;
  const s = f.format(n);
  return s === '-0' ? '0' : s;
}

export function formatPct(n: number): string {
  return `${formatNumber(n, Math.abs(n) < 10 && !Number.isInteger(n) ? 2 : 1)} %`;
}

export function formatGrams(grams: number, kind?: LineKind): string {
  return `${formatNumber(roundGrams(grams, kind), 1)} g`;
}

/** Grams number only, no unit. */
export function formatGramsValue(grams: number, kind?: LineKind): string {
  return formatNumber(roundGrams(grams, kind), 1);
}

export function formatRating(r: number | null): string {
  return r == null ? '—' : NF1_FIXED.format(r);
}

export function formatTemp(t: number | null): string | null {
  return t == null ? null : `${formatNumber(t, 1)} °C`;
}

export function formatHours(h: number | null): string | null {
  if (h == null) return null;
  return `${formatNumber(h, 1)} h`;
}

/** "4 h 30 min", "45 min", "32 h 10 min". */
export function formatDuration(totalMin: number | null): string {
  if (totalMin == null || !Number.isFinite(totalMin)) return '—';
  const m = Math.round(totalMin);
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (h === 0) return `${rest} min`;
  if (rest === 0) return `${h} h`;
  return `${h} h ${rest} min`;
}

/**
 * Parses user input, accepting "," or "." as decimal separator.
 * Returns null for empty or invalid input.
 */
export function parseDecimal(input: string): number | null {
  const s = input.trim().replace(/\s/g, '').replace(',', '.');
  if (s === '' || s === '-' || s === '.') return null;
  if (!/^-?\d*\.?\d*$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const DATE_SHORT = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const DATE_LONG = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const MONTH_LONG = new Intl.DateTimeFormat('es-ES', { month: 'long' });

const stripDots = (s: string) => s.replace(/\./g, '');

/** "12 oct 2026" */
export function formatDate(d: Date): string {
  return stripDots(DATE_SHORT.format(d));
}

/** "domingo 12 oct 2026" */
export function formatDateLong(d: Date): string {
  const parts = DATE_LONG.formatToParts(d);
  const get = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value ?? '';
  return stripDots(`${get('weekday')} ${get('day')} ${get('month')} ${get('year')}`);
}

export function formatMonth(d: Date): string {
  return MONTH_LONG.format(d);
}

/** yyyy-mm-dd in local time, for <input type="date">. */
export function toDateInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function fromDateInput(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);
}
