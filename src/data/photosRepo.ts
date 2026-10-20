import {
  Bytes,
  Timestamp,
  getDocs,
  query,
  where,
  type DocumentData,
  type WriteBatch,
} from 'firebase/firestore';
import type { Photo, PhotoTag } from '../domain/types';
import { isObj, num, oneOf, str } from './normalize';
import { userCol, userItem } from './paths';

const TAGS: PhotoTag[] = ['crust', 'crumb', 'pizza', 'other'];

/** A compressed photo ready to be stored (not yet in Firestore). */
export interface NewPhoto {
  id: string;
  tag: PhotoTag;
  data: Uint8Array;
  width: number;
  height: number;
  /** Small data-URL thumbnail, used if this photo becomes the cover. */
  thumb: string;
}

export function photoToDoc(p: Photo): DocumentData {
  return {
    bakeId: p.bakeId,
    tag: p.tag,
    data: Bytes.fromUint8Array(p.data),
    width: p.width,
    height: p.height,
    createdAt: Timestamp.fromDate(p.createdAt),
  };
}

export function photoFromDoc(id: string, d: DocumentData): Photo {
  const data = d.data instanceof Bytes ? d.data.toUint8Array() : new Uint8Array();
  const created = d.createdAt instanceof Timestamp ? d.createdAt.toDate() : new Date();
  return {
    id,
    bakeId: str(d.bakeId),
    tag: oneOf(d.tag, TAGS, 'other'),
    data,
    width: num(d.width, 0),
    height: num(d.height, 0),
    createdAt: created,
  };
}

export async function listPhotos(uid: string, bakeId: string): Promise<Photo[]> {
  const snap = await getDocs(query(userCol(uid, 'photos'), where('bakeId', '==', bakeId)));
  return snap.docs
    .map((d) => photoFromDoc(d.id, d.data()))
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export async function listAllPhotos(uid: string): Promise<Photo[]> {
  const snap = await getDocs(userCol(uid, 'photos'));
  return snap.docs.map((d) => photoFromDoc(d.id, d.data()));
}

export function addPhotoToBatch(batch: WriteBatch, uid: string, bakeId: string, p: NewPhoto) {
  batch.set(userItem(uid, 'photos', p.id), photoToDoc({ ...p, bakeId, createdAt: new Date() }));
}

export function setPhotoTagInBatch(batch: WriteBatch, uid: string, photoId: string, tag: PhotoTag) {
  batch.update(userItem(uid, 'photos', photoId), { tag });
}

export function deletePhotoInBatch(batch: WriteBatch, uid: string, photoId: string) {
  batch.delete(userItem(uid, 'photos', photoId));
}

export function isPhotoDoc(v: unknown): boolean {
  return isObj(v) && typeof v.bakeId === 'string';
}

export function photoBlob(p: Pick<Photo, 'data'>): Blob {
  return new Blob([p.data as Uint8Array<ArrayBuffer>], { type: 'image/webp' });
}
