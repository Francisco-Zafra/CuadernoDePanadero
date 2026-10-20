// Default preferments, presets and empty values.

import { es } from '../i18n/es';
import type {
  BakeType,
  Preferment,
  PrefermentKind,
  Preset,
  ProcessStep,
  ProcessStepKind,
  Recipe,
  SavedPreferment,
} from './types';

export const RATING_MAX = 5;
export const RATING_STEP = 0.5;

export type BuiltinPrefermentKind = Exclude<PrefermentKind, 'none' | 'custom'>;
export const BUILTIN_PREFERMENT_KINDS: BuiltinPrefermentKind[] = ['poolish', 'biga', 'sourdough'];

export const DEFAULT_PREFERMENTS: Record<BuiltinPrefermentKind, SavedPreferment> = {
  poolish: {
    id: 'poolish',
    name: es.preferments.poolish,
    flourPct: 30,
    hydration: 100,
    yeastPct: 0.1,
    hours: 14,
    tempC: 20,
  },
  biga: {
    id: 'biga',
    name: es.preferments.biga,
    flourPct: 50,
    hydration: 50,
    yeastPct: 1,
    hours: 18,
    tempC: 18,
  },
  sourdough: {
    id: 'sourdough',
    name: es.preferments.sourdough,
    flourPct: 20,
    hydration: 100,
    yeastPct: 0,
    hours: 5,
    tempC: 24,
  },
};

export function isBuiltinPreferment(id: string): id is BuiltinPrefermentKind {
  return (BUILTIN_PREFERMENT_KINDS as string[]).includes(id);
}

export const NO_PREFERMENT: Preferment = {
  kind: 'none',
  flourPct: 0,
  hydration: 0,
  yeastPct: 0,
  hours: null,
  tempC: null,
};

/** Builds a recipe preferment from a saved one (built-in or custom). */
export function prefermentFrom(saved: SavedPreferment): Preferment {
  const builtin = isBuiltinPreferment(saved.id);
  return {
    kind: builtin ? saved.id : 'custom',
    ...(builtin ? {} : { customId: saved.id, name: saved.name }),
    flourPct: saved.flourPct,
    hydration: saved.hydration,
    yeastPct: saved.yeastPct,
    hours: saved.hours,
    tempC: saved.tempC,
  } as Preferment;
}

export function emptyRecipe(type: BakeType = 'bread'): Recipe {
  return type === 'pizza'
    ? {
        pieces: 4,
        pieceWeight: 250,
        flours: [{ name: 'Harina tipo 00', pct: 100 }],
        hydration: 65,
        salt: 3,
        yeast: { kind: 'fresh', pct: 0.2 },
        extras: [],
        preferment: { ...NO_PREFERMENT },
      }
    : {
        pieces: 1,
        pieceWeight: 900,
        flours: [{ name: es.recipe.defaultFlour, pct: 100 }],
        hydration: 70,
        salt: 2,
        yeast: { kind: 'fresh', pct: 1 },
        extras: [],
        preferment: { ...NO_PREFERMENT },
      };
}

export const DEFAULT_PRESETS: Omit<Preset, 'id'>[] = [
  {
    name: 'Hogaza',
    type: 'bread',
    recipe: {
      pieces: 1,
      pieceWeight: 900,
      flours: [
        { name: 'Harina panificable', pct: 80 },
        { name: 'Harina integral de trigo', pct: 20 },
      ],
      hydration: 75,
      salt: 2,
      yeast: { kind: 'none', pct: 0 },
      extras: [],
      preferment: prefermentFrom(DEFAULT_PREFERMENTS.sourdough),
    },
  },
  {
    name: 'Chapata con poolish',
    type: 'bread',
    recipe: {
      pieces: 2,
      pieceWeight: 450,
      flours: [{ name: 'Harina de fuerza', pct: 100 }],
      hydration: 80,
      salt: 2,
      yeast: { kind: 'instant', pct: 0.2 },
      extras: [],
      preferment: prefermentFrom(DEFAULT_PREFERMENTS.poolish),
    },
  },
  {
    name: 'Napolitana con biga',
    type: 'pizza',
    recipe: {
      pieces: 4,
      pieceWeight: 250,
      flours: [{ name: 'Harina tipo 00', pct: 100 }],
      hydration: 65,
      salt: 3,
      yeast: { kind: 'fresh', pct: 0 },
      extras: [],
      preferment: prefermentFrom(DEFAULT_PREFERMENTS.biga),
    },
  },
  {
    name: 'Pizza en bandeja',
    type: 'pizza',
    recipe: {
      pieces: 1,
      pieceWeight: 900,
      flours: [{ name: 'Harina de fuerza', pct: 100 }],
      hydration: 75,
      salt: 2.5,
      yeast: { kind: 'instant', pct: 0.4 },
      extras: [{ name: 'Aceite de oliva', pct: 3 }],
      preferment: { ...NO_PREFERMENT },
    },
  },
];

export function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function newStep(kind: ProcessStepKind, overrides: Partial<ProcessStep> = {}): ProcessStep {
  return {
    id: newId(),
    kind,
    label: es.process.kinds[kind],
    durationMin: null,
    tempC: null,
    note: '',
    ...overrides,
  };
}

/** Display name of a recipe's preferment. */
export function prefermentName(p: Preferment): string {
  switch (p.kind) {
    case 'none':
      return es.preferments.noneLong;
    case 'custom':
      return p.name || es.preferments.custom;
    default:
      return es.preferments[p.kind];
  }
}
