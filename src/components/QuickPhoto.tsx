import type { NewPhoto } from '../data/photosRepo';
import type { BakeType } from '../domain/types';

export interface QuickPhotoState {
  newPhoto: NewPhoto | null;
}

/** Single photo for the quick note (filled in by the photos phase). */
export function useQuickPhoto(): QuickPhotoState {
  return { newPhoto: null };
}

export function QuickPhoto(_props: { state: QuickPhotoState; type: BakeType }) {
  return null;
}
