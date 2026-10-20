import { Link } from 'react-router';
import type { Bake } from '../domain/types';
import type { BakePhotosState } from '../hooks/useBakePhotos';
import { es } from '../i18n/es';
import { IconBack, IconCamera, Silhouette } from './Icons';
import { SkeletonBlock } from './Skeleton';

/** Top photo of the detail: the cover (thumb while it loads), back button and count. */
export function BakeHero({
  bake,
  photos,
  embedded,
}: {
  bake: Bake;
  photos: BakePhotosState;
  embedded: boolean;
}) {
  const cover = photos.photos[0];
  const count = bake.photoIds.length;
  return (
    <section className="detail__hero" aria-label={es.detail.mainPhoto}>
      <div className="detail__photo">
        {cover ? (
          <img src={cover.url} alt={es.photos.tags[cover.tag]} />
        ) : bake.thumb ? (
          <img src={bake.thumb} alt="" className="is-thumb" />
        ) : (
          <Silhouette type={bake.type} size={190} strokeWidth={0.9} />
        )}
      </div>
      {!embedded && (
        <div className="detail__hero-bar">
          <Link to="/" className="hero-btn" aria-label={es.detail.back}>
            <IconBack size={22} />
          </Link>
          {count > 1 && (
            <a
              href="#sec-fotos"
              className="hero-count"
              aria-label={es.photos.seeAll(count)}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('sec-fotos')?.scrollIntoView();
              }}
            >
              <span>{es.photos.count(1, count)}</span>
            </a>
          )}
        </div>
      )}
    </section>
  );
}

/** Photo grid of the detail, loaded on open. */
export function BakePhotos({ bake, photos }: { bake: Bake; photos: BakePhotosState }) {
  return (
    <>
      {photos.loading ? (
        <SkeletonBlock height={170} />
      ) : photos.error ? (
        <p className="notice">
          {es.photos.loadError} {photos.error}
        </p>
      ) : photos.photos.length === 0 ? (
        <p className="muted-italic">{es.photos.none}</p>
      ) : (
        <ul className="photo-grid">
          {photos.photos.map((p) => (
            <li key={p.id}>
              <figure className="photo">
                <a href={p.url} target="_blank" rel="noreferrer" className="photo__img">
                  <img
                    src={p.url}
                    alt={es.photos.tags[p.tag]}
                    loading="lazy"
                    width={p.width}
                    height={p.height}
                  />
                </a>
                <figcaption className="photo__cap">{es.photos.tags[p.tag]}</figcaption>
              </figure>
            </li>
          ))}
        </ul>
      )}
      <Link to={`/bake/${bake.id}/edit`} state={{ step: 3 }} className="link-btn">
        <IconCamera size={20} />
        {es.photos.add}
      </Link>
    </>
  );
}
