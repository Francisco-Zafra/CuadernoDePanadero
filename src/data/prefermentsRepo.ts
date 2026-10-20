import { deleteDoc, doc, getDocs, setDoc, type DocumentData } from 'firebase/firestore';
import {
  DEFAULT_PREFERMENTS,
  isBuiltinPreferment,
  type BuiltinPrefermentKind,
} from '../domain/defaults';
import type { SavedPreferment } from '../domain/types';
import { num, numOrNull, str } from './normalize';
import { userCol, userItem } from './paths';

// Built-in preferments (poolish, biga, sourdough) can be overridden: their
// edited values are stored under their own id. Custom ones get a generated id.

export function prefermentFromDoc(id: string, d: DocumentData): SavedPreferment {
  const fallback = isBuiltinPreferment(id) ? DEFAULT_PREFERMENTS[id] : undefined;
  return {
    id,
    name: str(d.name, fallback?.name ?? ''),
    flourPct: num(d.flourPct, fallback?.flourPct ?? 20),
    hydration: num(d.hydration, fallback?.hydration ?? 100),
    yeastPct: num(d.yeastPct, fallback?.yeastPct ?? 0),
    hours: d.hours === undefined ? (fallback?.hours ?? null) : numOrNull(d.hours),
    tempC: d.tempC === undefined ? (fallback?.tempC ?? null) : numOrNull(d.tempC),
  };
}

export function prefermentToDoc(p: SavedPreferment): DocumentData {
  const { id: _id, ...rest } = p;
  void _id;
  return rest;
}

/** Built-ins (with overrides applied) followed by the custom ones. */
export async function listPreferments(uid: string): Promise<SavedPreferment[]> {
  const snap = await getDocs(userCol(uid, 'preferments'));
  const stored = snap.docs.map((d) => prefermentFromDoc(d.id, d.data()));
  return mergeWithBuiltins(stored);
}

export function mergeWithBuiltins(stored: SavedPreferment[]): SavedPreferment[] {
  const builtins = (Object.keys(DEFAULT_PREFERMENTS) as BuiltinPrefermentKind[]).map(
    (k) => stored.find((s) => s.id === k) ?? DEFAULT_PREFERMENTS[k],
  );
  const custom = stored
    .filter((s) => !isBuiltinPreferment(s.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  return [...builtins, ...custom];
}

export function newPrefermentId(uid: string): string {
  return doc(userCol(uid, 'preferments')).id;
}

/** Writes are applied to the local cache immediately; the promise settles on server ack. */
export function savePreferment(uid: string, p: SavedPreferment): Promise<void> {
  return setDoc(userItem(uid, 'preferments', p.id), prefermentToDoc(p));
}

export function deletePreferment(uid: string, id: string): Promise<void> {
  return deleteDoc(userItem(uid, 'preferments', id));
}
