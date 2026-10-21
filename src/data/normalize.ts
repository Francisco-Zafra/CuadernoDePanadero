// Defensive parsing of stored / imported documents into domain objects.

import { NO_PREFERMENT } from '../domain/defaults';
import type {
  BakeType,
  Ingredient,
  Preferment,
  PrefermentKind,
  ProcessStep,
  ProcessStepKind,
  Recipe,
  YeastKind,
} from '../domain/types';
import { emptyRecipe, newId } from '../domain/defaults';

type Raw = Record<string, unknown>;

const isObj = (v: unknown): v is Raw => typeof v === 'object' && v !== null;
const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const numOrNull = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const str = (v: unknown, d = '') => (typeof v === 'string' ? v : d);
const oneOf = <T extends string>(v: unknown, opts: readonly T[], d: T): T =>
  opts.includes(v as T) ? (v as T) : d;

const PREF_KINDS: PrefermentKind[] = ['none', 'poolish', 'biga', 'sourdough', 'custom'];
const YEAST_KINDS: YeastKind[] = ['fresh', 'instant', 'active_dry', 'none'];
const STEP_KINDS: ProcessStepKind[] = [
  'preferment',
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

export const asBakeType = (v: unknown): BakeType => oneOf(v, ['bread', 'pizza'] as const, 'bread');

function ingredients(v: unknown): Ingredient[] {
  if (!Array.isArray(v)) return [];
  return v.filter(isObj).map((i) => ({ name: str(i.name), pct: num(i.pct, 0) }));
}

export function normalizePreferment(v: unknown): Preferment {
  if (!isObj(v)) return { ...NO_PREFERMENT };
  const kind = oneOf(v.kind, PREF_KINDS, 'none');
  const p: Preferment = {
    kind,
    flourPct: num(v.flourPct, 0),
    hydration: num(v.hydration, 0),
    yeastPct: num(v.yeastPct, 0),
    hours: numOrNull(v.hours),
    tempC: numOrNull(v.tempC),
  };
  if (typeof v.customId === 'string') p.customId = v.customId;
  if (typeof v.name === 'string') p.name = v.name;
  return p;
}

export function normalizeRecipe(v: unknown, type: BakeType = 'bread'): Recipe {
  const d = emptyRecipe(type);
  if (!isObj(v)) return d;
  const yeast = isObj(v.yeast) ? v.yeast : {};
  return {
    pieces: num(v.pieces, d.pieces),
    pieceWeight: num(v.pieceWeight, d.pieceWeight),
    flours: Array.isArray(v.flours) ? ingredients(v.flours) : d.flours,
    hydration: num(v.hydration, d.hydration),
    salt: num(v.salt, d.salt),
    yeast: { kind: oneOf(yeast.kind, YEAST_KINDS, d.yeast.kind), pct: num(yeast.pct, d.yeast.pct) },
    extras: ingredients(v.extras),
    preferment: normalizePreferment(v.preferment),
  };
}

export function normalizeProcess(v: unknown): ProcessStep[] {
  if (!Array.isArray(v)) return [];
  return v.filter(isObj).map((s) => ({
    id: str(s.id) || newId(),
    kind: oneOf(s.kind, STEP_KINDS, 'other'),
    label: str(s.label),
    durationMin: numOrNull(s.durationMin),
    tempC: numOrNull(s.tempC),
    note: str(s.note),
    ...(s.kind === 'folds'
      ? { foldCount: numOrNull(s.foldCount), foldEveryMin: numOrNull(s.foldEveryMin) }
      : {}),
    ...(s.kind === 'bake' && Array.isArray(s.stages)
      ? {
          stages: s.stages.filter(isObj).map((st) => ({
            min: numOrNull(st.min),
            tempC: numOrNull(st.tempC),
            note: str(st.note),
          })),
        }
      : {}),
  }));
}

export { isObj, num, numOrNull, str, oneOf };
