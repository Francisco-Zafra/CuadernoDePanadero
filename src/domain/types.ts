// Domain model. Pure types: no React, no Firebase.
// Dates are plain `Date`s here; the data layer converts them to Firestore Timestamps.

export type BakeType = 'bread' | 'pizza';
export type PrefermentKind = 'none' | 'poolish' | 'biga' | 'sourdough' | 'custom';
export type YeastKind = 'fresh' | 'instant' | 'active_dry' | 'none';
export type BakeStatus = 'complete' | 'incomplete';
export type PhotoTag = 'crust' | 'crumb' | 'pizza' | 'other';

export type ProcessStepKind =
  | 'preferment'
  | 'autolyse'
  | 'mix'
  | 'folds'
  | 'bulk'
  | 'cold'
  | 'shape'
  | 'proof'
  | 'bake'
  | 'other';

export interface Ingredient {
  name: string;
  pct: number;
}

export interface Preferment {
  kind: PrefermentKind;
  customId?: string;
  name?: string;
  /** % of the TOTAL flour that goes into the preferment. */
  flourPct: number;
  /** Preferment's own hydration (water over its flour). */
  hydration: number;
  /** % over the PREFERMENT's flour (0 for sourdough). */
  yeastPct: number;
  hours: number | null;
  tempC: number | null;
}

export interface Recipe {
  pieces: number;
  pieceWeight: number;
  flours: Ingredient[];
  /** % over TOTAL flour, preferment included. */
  hydration: number;
  salt: number;
  yeast: { kind: YeastKind; pct: number };
  extras: Ingredient[];
  preferment: Preferment;
}

/** One stretch of the bake: "20 min a 230 °C, tapa cerrada". */
export interface BakeStage {
  min: number | null;
  tempC: number | null;
  note: string;
}

export interface ProcessStep {
  id: string;
  kind: ProcessStepKind;
  label: string;
  durationMin: number | null;
  tempC: number | null;
  note: string;
  /** Folds only: how many, and minutes between them. */
  foldCount?: number | null;
  foldEveryMin?: number | null;
  /** Bake only: its stretches in order; durationMin is their sum. */
  stages?: BakeStage[];
}

export interface Bake {
  id: string;
  name: string;
  type: BakeType;
  date: Date;
  status: BakeStatus;
  recipe: Recipe;
  process: ProcessStep[];
  /** 1–5, half steps allowed. */
  rating: number | null;
  notes: string;
  nextTime: string;
  photoIds: string[];
  coverPhotoId: string | null;
  /** ~240px WebP thumbnail as a data URL, used in lists. */
  thumb: string | null;
  sourceBakeId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** A bake as edited or saved, before it has an id and timestamps. */
export type BakeInput = Omit<Bake, 'id' | 'createdAt' | 'updatedAt'> & { createdAt?: Date };

export interface Photo {
  id: string;
  bakeId: string;
  tag: PhotoTag;
  /** Compressed WebP bytes. */
  data: Uint8Array;
  width: number;
  height: number;
  createdAt: Date;
}

/** A user-saved preferment (custom) or an override of a built-in one. */
export interface SavedPreferment {
  id: string;
  name: string;
  flourPct: number;
  hydration: number;
  yeastPct: number;
  hours: number | null;
  tempC: number | null;
}

export interface Preset {
  id: string;
  name: string;
  type: BakeType;
  recipe: Recipe;
}
