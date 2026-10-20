import type { BakeType, PhotoTag } from '../domain/types';
import type { PhotoEditing } from '../hooks/usePhotoEditing';
import { es } from '../i18n/es';
import { IconClose } from './Icons';
import { PhotoUploader } from './PhotoUploader';
import { SkeletonBlock } from './Skeleton';

const TAGS: PhotoTag[] = ['crust', 'crumb', 'pizza', 'other'];

/** Editor step: add several photos, tag them and pick the cover. */
export function PhotosStep({ editing, type }: { editing: PhotoEditing; type: BakeType }) {
  const { items, coverId, loading, processing } = editing;
  return (
    <div className="photos-step">
      {loading ? (
        <SkeletonBlock height={160} />
      ) : items.length === 0 && processing === 0 ? (
        <p className="muted-italic">{es.photos.none}</p>
      ) : (
        <ul className="photo-grid photo-grid--edit">
          {items.map((p, i) => {
            const isCover = p.id === coverId;
            return (
              <li key={p.id} className="photo-edit">
                <span className="photo-edit__img">
                  <img src={p.url} alt={`${es.photos.title} ${i + 1}`} />
                  {isCover && <span className="photo-edit__cover">{es.photos.cover}</span>}
                </span>
                <label className="field">
                  <span className="sr-only">
                    {es.photos.tagLabel} {i + 1}
                  </span>
                  <select
                    className="input-line"
                    value={p.tag}
                    onChange={(e) => editing.setTag(p.id, e.target.value as PhotoTag)}
                  >
                    {TAGS.map((t) => (
                      <option key={t} value={t}>
                        {es.photos.tags[t]}
                      </option>
                    ))}
                  </select>
                </label>
                <span className="photo-edit__actions">
                  {!isCover && (
                    <button
                      type="button"
                      className="small-btn"
                      onClick={() => editing.setCover(p.id)}
                    >
                      {es.photos.makeCover}
                    </button>
                  )}
                  <button
                    type="button"
                    className="icon-btn icon-btn--danger"
                    aria-label={`${es.photos.remove} ${i + 1}`}
                    onClick={() => editing.remove(p.id)}
                  >
                    <IconClose size={18} />
                  </button>
                </span>
              </li>
            );
          })}
          {Array.from({ length: processing }, (_, i) => (
            <li key={`p${i}`} className="photo-edit">
              <span className="photo-edit__img skeleton" aria-label={es.photos.processing} />
            </li>
          ))}
        </ul>
      )}
      <PhotoUploader onFiles={(f) => editing.add(f, type)} busy={processing > 0} />
    </div>
  );
}
