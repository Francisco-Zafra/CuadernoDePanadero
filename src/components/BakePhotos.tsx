import type { Bake } from '../domain/types';
import { es } from '../i18n/es';
import { IconBack, Silhouette } from './Icons';
import { Link } from 'react-router';

export interface BakePhotosState {
  loading: boolean;
}

/** Photos of a bake, loaded when the detail opens (filled in by the photos phase). */
export function useBakePhotos(_uid: string, _bake: Bake): BakePhotosState {
  return { loading: false };
}

export function BakeHero({
  bake,
  embedded,
}: {
  bake: Bake;
  photos: BakePhotosState;
  embedded: boolean;
}) {
  return (
    <section className="detail__hero" aria-label={es.detail.mainPhoto}>
      <div className="detail__photo">
        {bake.thumb ? (
          <img src={bake.thumb} alt="" />
        ) : (
          <Silhouette type={bake.type} size={190} strokeWidth={0.9} />
        )}
      </div>
      {!embedded && (
        <div className="detail__hero-bar">
          <Link to="/" className="hero-btn" aria-label={es.detail.back}>
            <IconBack size={22} />
          </Link>
        </div>
      )}
    </section>
  );
}

export function BakePhotos(_props: { bake: Bake; photos: BakePhotosState }) {
  return <p className="muted-italic">{es.photos.none}</p>;
}
