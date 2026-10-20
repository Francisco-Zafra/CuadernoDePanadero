import { useEffect, useRef, useState } from 'react';
import { newPhotoId } from '../data/bakesRepo';
import { errorMessage } from '../data/errors';
import { compressImage, imageBlob } from '../data/imageProcessing';
import type { NewPhoto } from '../data/photosRepo';
import type { BakeType } from '../domain/types';
import { useUid } from './useAuth';
import { useToast } from '../components/Toast';

export interface QuickPhotoState {
  newPhoto: NewPhoto | null;
  url: string | null;
  processing: boolean;
  pick: (file: File, type: BakeType) => void;
  clear: () => void;
}

/** The single photo of a quick note. */
export function useQuickPhoto(): QuickPhotoState {
  const uid = useUid();
  const toast = useToast();
  const [photo, setPhoto] = useState<{ p: NewPhoto; url: string } | null>(null);
  const [processing, setProcessing] = useState(false);
  const current = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (current.current) URL.revokeObjectURL(current.current);
    },
    [],
  );

  const replace = (next: { p: NewPhoto; url: string } | null) => {
    if (current.current) URL.revokeObjectURL(current.current);
    current.current = next?.url ?? null;
    setPhoto(next);
  };

  return {
    newPhoto: photo?.p ?? null,
    url: photo?.url ?? null,
    processing,
    clear: () => replace(null),
    pick: (file, type) => {
      setProcessing(true);
      compressImage(file)
        .then((img) => {
          const p: NewPhoto = {
            id: newPhotoId(uid),
            tag: type === 'pizza' ? 'pizza' : 'crust',
            ...img,
          };
          replace({ p, url: URL.createObjectURL(imageBlob(img.data)) });
        })
        .catch((err) => toast.error(errorMessage(err)))
        .finally(() => setProcessing(false));
    },
  };
}
