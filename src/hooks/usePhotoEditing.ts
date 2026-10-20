import { useCallback, useEffect, useRef, useState } from 'react';
import { newPhotoId, type PhotoChanges } from '../data/bakesRepo';
import { errorMessage } from '../data/errors';
import { compressImage, imageBlob, thumbForStored } from '../data/imageProcessing';
import { listPhotos, type NewPhoto } from '../data/photosRepo';
import type { Bake, BakeInput, BakeType, PhotoTag } from '../domain/types';
import { useToast } from '../components/Toast';

export interface EditorPhoto {
  id: string;
  tag: PhotoTag;
  url: string;
  /** Set for photos added in this session (not stored yet). */
  pending?: NewPhoto;
  /** Stored bytes, kept to build a thumbnail if it becomes the cover. */
  stored?: Uint8Array;
}

export interface PhotoEditing {
  items: EditorPhoto[];
  coverId: string | null;
  loading: boolean;
  processing: number;
  add: (files: FileList | File[], type: BakeType) => void;
  remove: (id: string) => void;
  setTag: (id: string, tag: PhotoTag) => void;
  setCover: (id: string) => void;
  result: (bake: BakeInput) => {
    changes: PhotoChanges;
    photoIds: string[];
    coverPhotoId: string | null;
    thumb: string | null;
  };
}

const defaultTag = (type: BakeType): PhotoTag => (type === 'pizza' ? 'pizza' : 'crust');

/** Photo changes made in the editor; written together with the bake on save. */
export function usePhotoEditing(uid: string, bake: Bake | null): PhotoEditing {
  const toast = useToast();
  const [items, setItems] = useState<EditorPhoto[]>([]);
  const [original, setOriginal] = useState<Record<string, PhotoTag>>({});
  const [coverChoice, setCoverChoice] = useState<string | null>(bake?.coverPhotoId ?? null);
  const [loading, setLoading] = useState(!!bake && bake.photoIds.length > 0);
  const [processing, setProcessing] = useState(0);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const urls = useRef<string[]>([]);

  const bakeId = bake?.id;
  const hasStored = !!bake && bake.photoIds.length > 0;
  useEffect(() => {
    if (!bakeId || !hasStored) return;
    let cancelled = false;
    listPhotos(uid, bakeId)
      .then((photos) => {
        if (cancelled) return;
        const loaded = photos.map((p) => {
          const url = URL.createObjectURL(imageBlob(p.data));
          urls.current.push(url);
          return { id: p.id, tag: p.tag, url, stored: p.data };
        });
        setItems((cur) => [...loaded, ...cur.filter((c) => c.pending)]);
        setOriginal(Object.fromEntries(photos.map((p) => [p.id, p.tag])));
      })
      .catch((err) => toast.error(errorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [uid, bakeId, hasStored, toast]);

  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const coverId =
    coverChoice && items.some((i) => i.id === coverChoice) ? coverChoice : (items[0]?.id ?? null);

  // A stored photo that becomes the cover needs a fresh thumbnail.
  const cover = items.find((i) => i.id === coverId);
  const needsThumb =
    cover?.stored && !thumbs[cover.id] && cover.id !== bake?.coverPhotoId ? cover : null;
  useEffect(() => {
    if (!needsThumb?.stored) return;
    let cancelled = false;
    thumbForStored(needsThumb.stored)
      .then((t) => !cancelled && setThumbs((m) => ({ ...m, [needsThumb.id]: t })))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [needsThumb]);

  const add = useCallback(
    (files: FileList | File[], type: BakeType) => {
      for (const file of Array.from(files)) {
        setProcessing((n) => n + 1);
        compressImage(file)
          .then((img) => {
            const id = newPhotoId(uid);
            const pending: NewPhoto = { id, tag: defaultTag(type), ...img };
            const url = URL.createObjectURL(imageBlob(img.data));
            urls.current.push(url);
            setItems((cur) => [...cur, { id, tag: pending.tag, url, pending }]);
          })
          .catch((err) => toast.error(errorMessage(err)))
          .finally(() => setProcessing((n) => n - 1));
      }
    },
    [uid, toast],
  );

  return {
    items,
    coverId,
    loading,
    processing,
    add,
    remove: (id) => setItems((cur) => cur.filter((i) => i.id !== id)),
    setTag: (id, tag) => setItems((cur) => cur.map((i) => (i.id === id ? { ...i, tag } : i))),
    setCover: setCoverChoice,
    result: (b) => {
      // Photos still loading: keep what the bake already had.
      if (loading) {
        return {
          changes: { added: [], removedIds: [], tagChanges: {} },
          photoIds: b.photoIds,
          coverPhotoId: b.coverPhotoId,
          thumb: b.thumb,
        };
      }
      const ids = items.map((i) => i.id);
      const added = items.filter((i) => i.pending).map((i) => ({ ...i.pending!, tag: i.tag }));
      const removedIds = Object.keys(original).filter((id) => !ids.includes(id));
      const tagChanges: Record<string, PhotoTag> = {};
      for (const i of items)
        if (!i.pending && original[i.id] && original[i.id] !== i.tag) tagChanges[i.id] = i.tag;
      const c = items.find((i) => i.id === coverId);
      const thumb = !c
        ? null
        : (c.pending?.thumb ??
          thumbs[c.id] ??
          (c.id === bake?.coverPhotoId ? bake.thumb : b.thumb));
      return {
        changes: { added, removedIds, tagChanges },
        photoIds: ids,
        coverPhotoId: c?.id ?? null,
        thumb,
      };
    },
  };
}
