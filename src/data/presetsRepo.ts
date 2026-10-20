import { deleteDoc, doc, getDocs, setDoc, writeBatch, type DocumentData } from 'firebase/firestore';
import { DEFAULT_PRESETS } from '../domain/defaults';
import type { Preset } from '../domain/types';
import { getDb } from './firebase';
import { asBakeType, normalizeRecipe, str } from './normalize';
import { userCol, userDoc, userItem } from './paths';

export function presetFromDoc(id: string, d: DocumentData): Preset {
  const type = asBakeType(d.type);
  return { id, name: str(d.name), type, recipe: normalizeRecipe(d.recipe, type) };
}

export function presetToDoc(p: Preset): DocumentData {
  return { name: p.name, type: p.type, recipe: p.recipe };
}

export async function listPresets(uid: string): Promise<Preset[]> {
  const snap = await getDocs(userCol(uid, 'presets'));
  return snap.docs
    .map((d) => presetFromDoc(d.id, d.data()))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export function newPresetId(uid: string): string {
  return doc(userCol(uid, 'presets')).id;
}

export function savePreset(uid: string, p: Preset): Promise<void> {
  return setDoc(userItem(uid, 'presets', p.id), presetToDoc(p));
}

export function deletePreset(uid: string, id: string): Promise<void> {
  return deleteDoc(userItem(uid, 'presets', id));
}

/**
 * On first sign-in, creates the default presets. The profile doc remembers it so
 * presets the user deletes are not re-created.
 */
export function seedDefaultPresets(uid: string): Preset[] {
  const batch = writeBatch(getDb());
  const created = DEFAULT_PRESETS.map((p) => ({ ...p, id: newPresetId(uid) }));
  for (const p of created) batch.set(userItem(uid, 'presets', p.id), presetToDoc(p));
  batch.set(userDoc(uid), { presetsSeeded: true }, { merge: true });
  void batch.commit().catch(() => undefined);
  return created;
}
