import { useEffect, useState } from 'react';
import { errorMessage } from '../data/errors';
import { imageBlob } from '../data/imageProcessing';
import { listPhotos } from '../data/photosRepo';
import type { Bake, PhotoTag } from '../domain/types';

export interface ShownPhoto {
  id: string;
  tag: PhotoTag;
  url: string;
  width: number;
  height: number;
}

export interface BakePhotosState {
  loading: boolean;
  error: string | null;
  photos: ShownPhoto[];
}

/**
 * Loads a bake's photos when its detail opens (lists only use the thumbnail).
 * Ordered as in `photoIds`, cover first.
 */
export function useBakePhotos(uid: string, bake: Bake): BakePhotosState {
  const key = bake.photoIds.join(',');
  const [state, setState] = useState<BakePhotosState & { key: string }>({
    key: '',
    loading: false,
    error: null,
    photos: [],
  });

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    const created: string[] = [];
    listPhotos(uid, bake.id)
      .then((list) => {
        if (cancelled) return;
        const order = key.split(',');
        const cover = bake.coverPhotoId;
        const sorted = list
          .filter((p) => order.includes(p.id))
          .sort((a, b) => {
            if (a.id === cover) return -1;
            if (b.id === cover) return 1;
            return order.indexOf(a.id) - order.indexOf(b.id);
          });
        const photos = sorted.map((p) => {
          const url = URL.createObjectURL(imageBlob(p.data));
          created.push(url);
          return { id: p.id, tag: p.tag, url, width: p.width, height: p.height };
        });
        setState({ key, loading: false, error: null, photos });
      })
      .catch(
        (err) =>
          !cancelled && setState({ key, loading: false, error: errorMessage(err), photos: [] }),
      );
    return () => {
      cancelled = true;
      created.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [uid, bake.id, bake.coverPhotoId, key]);

  if (!key) return { loading: false, error: null, photos: [] };
  if (state.key !== key) return { loading: true, error: null, photos: [] };
  return state;
}
