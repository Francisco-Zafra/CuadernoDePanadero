import type { BakeType } from '../domain/types';
import type { QuickPhotoState } from '../hooks/useQuickPhoto';
import { es } from '../i18n/es';
import { IconClose, Silhouette } from './Icons';
import { PhotoUploader } from './PhotoUploader';

/** Single photo slot of the quick note: preview + dashed "Añadir" tile. */
export function QuickPhoto({ state, type }: { state: QuickPhotoState; type: BakeType }) {
  return (
    <div className="field">
      <span className="field-label">{es.editor.photo}</span>
      <div className="quick-photo">
        <span className="quick-photo__preview">
          {state.url ? (
            <img src={state.url} alt={es.editor.photo} />
          ) : (
            <Silhouette type={type} size={60} strokeWidth={1.6} />
          )}
        </span>
        <PhotoUploader
          variant="tile"
          multiple={false}
          busy={state.processing}
          onFiles={(f) => f[0] && state.pick(f[0], type)}
        />
        {state.url && (
          <button
            type="button"
            className="icon-btn icon-btn--danger"
            aria-label={es.photos.remove}
            onClick={state.clear}
          >
            <IconClose size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
