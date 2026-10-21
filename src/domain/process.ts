// Process helpers: keep the preferment step first and in sync with the recipe.

import { newStep, prefermentName } from './defaults';
import type { BakeStage, Preferment, ProcessStep, ProcessStepKind } from './types';

/**
 * If the recipe has a preferment, the first step must be its own; it takes its
 * duration and temperature from the preferment. Without one, that step goes away.
 */
export function syncPrefermentStep(steps: ProcessStep[], pref: Preferment): ProcessStep[] {
  const rest = steps.filter((s) => s.kind !== 'preferment');
  if (pref.kind === 'none') return rest;
  const existing = steps.find((s) => s.kind === 'preferment');
  const step: ProcessStep = {
    ...(existing ?? newStep('preferment')),
    label: prefermentName(pref),
    durationMin: pref.hours == null ? null : Math.round(pref.hours * 60),
    tempC: pref.tempC,
  };
  return [step, ...rest];
}

/** Which values make sense for each kind of step (the preferment step takes its own). */
export interface StepFields {
  /** 'min' for short steps, 'hm' (hours + minutes) for long ones, null when time does not matter. */
  duration: 'min' | 'hm' | null;
  temp: boolean;
  folds?: boolean;
  stages?: boolean;
}

export const STEP_FIELDS: Record<Exclude<ProcessStepKind, 'preferment'>, StepFields> = {
  autolyse: { duration: 'min', temp: false },
  mix: { duration: 'min', temp: true },
  folds: { duration: null, temp: false, folds: true },
  bulk: { duration: 'hm', temp: true },
  cold: { duration: 'hm', temp: true },
  shape: { duration: null, temp: false },
  proof: { duration: 'hm', temp: true },
  bake: { duration: null, temp: false, stages: true },
  other: { duration: 'hm', temp: true },
};

/** A bake's stretches; older bakes only have one duration and temperature. */
export function bakeStages(step: ProcessStep): BakeStage[] {
  if (step.stages && step.stages.length > 0) return step.stages;
  return [{ min: step.durationMin, tempC: step.tempC, note: '' }];
}

/** Sum of the stretches' known minutes (null when none is known). */
export function stagesDurationMin(stages: BakeStage[]): number | null {
  const known = stages.filter((s) => s.min != null);
  return known.length === 0 ? null : known.reduce((sum, s) => sum + (s.min ?? 0), 0);
}

/** Folds span: count × interval, once both are known. */
export function foldsDurationMin(count: number | null, everyMin: number | null): number | null {
  return count != null && everyMin != null ? count * everyMin : null;
}

export function totalDurationMin(steps: ProcessStep[]): number | null {
  const known = steps.filter((s) => s.durationMin != null);
  if (known.length === 0) return null;
  return known.reduce((sum, s) => sum + (s.durationMin ?? 0), 0);
}

export function moveStep(steps: ProcessStep[], index: number, delta: -1 | 1): ProcessStep[] {
  const target = index + delta;
  if (target < 0 || target >= steps.length) return steps;
  // The preferment step stays first.
  if (steps[target]?.kind === 'preferment' || steps[index]?.kind === 'preferment') return steps;
  const copy = steps.slice();
  const [item] = copy.splice(index, 1);
  if (item) copy.splice(target, 0, item);
  return copy;
}
