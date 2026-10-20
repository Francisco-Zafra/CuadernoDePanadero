import type { BakeInput, PhotoChanges } from '../data/bakesRepo';
import type { Bake, BakeType } from '../domain/types';
import { es } from '../i18n/es';

export interface PhotoEditing {
  result: (bake: BakeInput) => {
    changes: PhotoChanges;
    photoIds: string[];
    coverPhotoId: string | null;
    thumb: string | null;
  };
}

/** Photo changes made in the editor (filled in by the photos phase). */
export function usePhotoEditing(_uid: string, bake: Bake | null): PhotoEditing {
  return {
    result: (b) => ({
      changes: { added: [], removedIds: [], tagChanges: {} },
      photoIds: bake?.photoIds ?? b.photoIds,
      coverPhotoId: bake?.coverPhotoId ?? b.coverPhotoId,
      thumb: bake?.thumb ?? b.thumb,
    }),
  };
}

export function PhotosStep(_props: { editing: PhotoEditing; type: BakeType }) {
  return <p className="muted-italic">{es.photos.none}</p>;
}
