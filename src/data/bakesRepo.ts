import {
  Timestamp,
  doc,
  onSnapshot,
  orderBy,
  query,
  writeBatch,
  type DocumentData,
  type WriteBatch,
} from 'firebase/firestore';
import type { Bake, PhotoTag } from '../domain/types';
import { getDb } from './firebase';
import {
  asBakeType,
  isObj,
  normalizeProcess,
  normalizeRecipe,
  numOrNull,
  oneOf,
  str,
} from './normalize';
import { userCol, userItem } from './paths';
import {
  addPhotoToBatch,
  deletePhotoInBatch,
  listPhotos,
  setPhotoTagInBatch,
  type NewPhoto,
} from './photosRepo';

export type BakeInput = Omit<Bake, 'id' | 'createdAt' | 'updatedAt'> & { createdAt?: Date };

const ts = (v: unknown) =>
  v instanceof Timestamp ? v.toDate() : v instanceof Date ? v : new Date(0);

export function bakeFromDoc(id: string, d: DocumentData): Bake {
  const type = asBakeType(d.type);
  return {
    id,
    name: str(d.name),
    type,
    date: ts(d.date),
    status: oneOf(d.status, ['complete', 'incomplete'] as const, 'complete'),
    recipe: normalizeRecipe(d.recipe, type),
    process: normalizeProcess(d.process),
    rating: numOrNull(d.rating),
    notes: str(d.notes),
    nextTime: str(d.nextTime),
    photoIds: Array.isArray(d.photoIds)
      ? d.photoIds.filter((x): x is string => typeof x === 'string')
      : [],
    coverPhotoId: typeof d.coverPhotoId === 'string' ? d.coverPhotoId : null,
    thumb: typeof d.thumb === 'string' ? d.thumb : null,
    sourceBakeId: typeof d.sourceBakeId === 'string' ? d.sourceBakeId : null,
    createdAt: ts(d.createdAt),
    updatedAt: ts(d.updatedAt),
  };
}

export function bakeToDoc(b: Omit<Bake, 'id'>): DocumentData {
  return {
    name: b.name,
    type: b.type,
    date: Timestamp.fromDate(b.date),
    status: b.status,
    recipe: b.recipe,
    process: b.process,
    rating: b.rating,
    notes: b.notes,
    nextTime: b.nextTime,
    photoIds: b.photoIds,
    coverPhotoId: b.coverPhotoId,
    thumb: b.thumb,
    sourceBakeId: b.sourceBakeId,
    createdAt: Timestamp.fromDate(b.createdAt),
    updatedAt: Timestamp.fromDate(b.updatedAt),
  };
}

export function isBakeDoc(v: unknown): boolean {
  return isObj(v) && typeof v.name === 'string';
}

/** One listener for the whole journal (avoid extra listeners: Spark quota). */
export function watchBakes(
  uid: string,
  onData: (bakes: Bake[], fromCache: boolean) => void,
  onError: (err: unknown) => void,
): () => void {
  return onSnapshot(
    query(userCol(uid, 'bakes'), orderBy('date', 'desc')),
    (snap) =>
      onData(
        snap.docs.map((d) => bakeFromDoc(d.id, d.data())),
        snap.metadata.fromCache,
      ),
    onError,
  );
}

export function newBakeId(uid: string): string {
  return doc(userCol(uid, 'bakes')).id;
}

export function newPhotoId(uid: string): string {
  return doc(userCol(uid, 'photos')).id;
}

export interface PhotoChanges {
  added: NewPhoto[];
  removedIds: string[];
  tagChanges: Record<string, PhotoTag>;
}

const NO_PHOTO_CHANGES: PhotoChanges = { added: [], removedIds: [], tagChanges: {} };
// Firestore requests are limited to 10 MiB; keep each batch well under that.
const MAX_BATCH_BYTES = 8 * 1024 * 1024;

/**
 * Creates or updates a bake together with its photo changes. Photos are written
 * first (possibly in several batches) and the bake last, so the bake never points
 * at photos that were not stored.
 *
 * The local cache is updated synchronously when this is called; the returned
 * promise only settles when the server acknowledges (never, while offline), so
 * callers should not block the UI on it, only report its errors.
 */
export function saveBake(
  uid: string,
  id: string,
  input: BakeInput,
  photos: PhotoChanges = NO_PHOTO_CHANGES,
): Promise<void> {
  const db = getDb();
  const now = new Date();
  const batches: WriteBatch[] = [];

  let batch = writeBatch(db);
  let bytes = 0;
  let pending = 0;
  for (const p of photos.added) {
    if (pending > 0 && bytes + p.data.byteLength > MAX_BATCH_BYTES) {
      batches.push(batch);
      batch = writeBatch(db);
      bytes = 0;
      pending = 0;
    }
    addPhotoToBatch(batch, uid, id, p);
    bytes += p.data.byteLength;
    pending++;
  }
  if (pending > 0 && bytes > MAX_BATCH_BYTES / 2) {
    batches.push(batch);
    batch = writeBatch(db);
  }

  for (const pid of photos.removedIds) deletePhotoInBatch(batch, uid, pid);
  for (const [pid, tag] of Object.entries(photos.tagChanges)) {
    if (!photos.removedIds.includes(pid) && !photos.added.some((p) => p.id === pid)) {
      setPhotoTagInBatch(batch, uid, pid, tag);
    }
  }
  const { createdAt, ...rest } = input;
  batch.set(
    userItem(uid, 'bakes', id),
    bakeToDoc({ ...rest, createdAt: createdAt ?? now, updatedAt: now }),
  );
  batches.push(batch);

  // Commits are applied locally in call order, so no need to await between them.
  return Promise.all(batches.map((b) => b.commit())).then(() => undefined);
}

/**
 * Deletes a bake and all its photos in one batch. Resolves once the deletion is
 * queued locally; `synced` settles when the server acknowledges.
 */
export async function deleteBake(uid: string, bake: Bake): Promise<{ synced: Promise<void> }> {
  const ids = new Set(bake.photoIds);
  try {
    for (const p of await listPhotos(uid, bake.id)) ids.add(p.id);
  } catch {
    // Offline without cached photos: delete the ones we know about.
  }
  const batch = writeBatch(getDb());
  for (const pid of ids) deletePhotoInBatch(batch, uid, pid);
  batch.delete(userItem(uid, 'bakes', bake.id));
  return { synced: batch.commit() };
}
