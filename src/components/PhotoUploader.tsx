import { useRef } from 'react';
import { es } from '../i18n/es';
import { IconCamera } from './Icons';

interface Props {
  onFiles: (files: File[]) => void;
  multiple?: boolean;
  /** "tile" is the dashed square of the quick note; "link" is a text button. */
  variant?: 'tile' | 'link';
  busy?: boolean;
  label?: string;
}

/** Opens the camera / gallery. Compression happens in the caller. */
export function PhotoUploader({ onFiles, multiple = true, variant = 'link', busy, label }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const text = busy
    ? es.photos.processing
    : (label ?? (variant === 'tile' ? es.photos.addShort : es.photos.add));
  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple={multiple}
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = '';
          if (files.length) onFiles(files);
        }}
      />
      <button
        type="button"
        className={variant === 'tile' ? 'photo-tile' : 'link-btn'}
        onClick={() => input.current?.click()}
        disabled={busy}
        aria-busy={busy || undefined}
      >
        <IconCamera size={variant === 'tile' ? 24 : 20} />
        {text}
      </button>
    </>
  );
}
