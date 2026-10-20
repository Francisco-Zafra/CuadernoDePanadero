// Process helpers: keep the preferment step first and in sync with the recipe.

import { newStep, prefermentName } from './defaults';
import type { Preferment, ProcessStep } from './types';

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
