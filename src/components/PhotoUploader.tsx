import { useRef, type ChangeEvent, type ReactNode } from 'react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { es } from '../i18n/es';
import { IconCamera, IconImage } from './Icons';

interface Props {
  onFiles: (files: File[]) => void;
  multiple?: boolean;
  /** "tile" is the dashed square of the quick note; "link" is a text button. */
  variant?: 'tile' | 'link';
  busy?: boolean;
  label?: string;
}

/** Touch devices (phones, tablets): there the camera gets its own button. */
const TOUCH_QUERY = '(pointer: coarse)';

/**
 * Opens the gallery and, on touch devices, the camera directly (some Android
 * pickers do not offer it otherwise). Compression happens in the caller.
 */
export function PhotoUploader({ onFiles, multiple = true, variant = 'link', busy, label }: Props) {
  const gallery = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const touch = useMediaQuery(TOUCH_QUERY);
  const tile = variant === 'tile';
  const iconSize = tile ? 24 : 20;
  const pick = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length) onFiles(files);
  };
  const button = (onClick: () => void, icon: ReactNode, text: string) => (
    <button
      type="button"
      className={tile ? 'photo-tile' : 'link-btn'}
      onClick={onClick}
      disabled={busy}
      aria-busy={busy || undefined}
    >
      {icon}
      {busy ? es.photos.processing : text}
    </button>
  );

  const galleryText = touch
    ? tile
      ? es.photos.gallery
      : es.photos.fromGallery
    : (label ?? (tile ? es.photos.addShort : es.photos.add));

  return (
    <span className={tile ? 'photo-uploader photo-uploader--tiles' : 'photo-uploader'}>
      <input
        ref={gallery}
        type="file"
        accept="image/*"
        multiple={multiple}
        hidden
        onChange={pick}
      />
      {touch && (
        <>
          <input
            ref={camera}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={pick}
          />
          {button(
            () => camera.current?.click(),
            <IconCamera size={iconSize} />,
            tile ? es.photos.camera : es.photos.takePhoto,
          )}
        </>
      )}
      {button(
        () => gallery.current?.click(),
        touch ? <IconImage size={iconSize} /> : <IconCamera size={iconSize} />,
        galleryText,
      )}
    </span>
  );
}
