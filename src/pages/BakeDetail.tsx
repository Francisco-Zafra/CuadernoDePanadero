import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ConfirmInline } from '../components/ConfirmInline';
import { IconBack, IconEdit, IconTrash, Silhouette } from '../components/Icons';
import { metaLine } from '../components/bakeText';
import { RatingDisplay } from '../components/Rating';
import { SkeletonBlock } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import { deleteBake } from '../data/bakesRepo';
import { errorMessage } from '../data/errors';
import { totalDoughWeight } from '../domain/bakersMath';
import { formatGrams, formatPct } from '../domain/format';
import type { Bake } from '../domain/types';
import { useUid } from '../hooks/useAuth';
import { useBake } from '../hooks/useBake';
import { SPLIT_QUERY, useMediaQuery } from '../hooks/useMediaQuery';
import { es } from '../i18n/es';
import { Journal } from './Journal';

/** Route /bake/:id — full page on mobile, list + detail on wide screens. */
export function BakeDetailPage() {
  const { id } = useParams();
  const split = useMediaQuery(SPLIT_QUERY);
  const { bake, loading } = useBake(id);
  if (split) return <Journal selectedId={id} />;
  if (loading)
    return (
      <div className="page">
        <SkeletonBlock height={330} />
      </div>
    );
  if (!bake) return <NotFound />;
  return <BakeDetail bake={bake} />;
}

function NotFound() {
  return (
    <div className="page">
      <p className="notice">{es.errors.notFound}</p>
      <Link to="/" className="text-link">
        {es.detail.back}
      </Link>
    </div>
  );
}

export function BakeDetail({ bake, embedded = false }: { bake: Bake; embedded?: boolean }) {
  const uid = useUid();
  const navigate = useNavigate();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    try {
      const { synced } = await deleteBake(uid, bake);
      synced.catch((err) => toast.error(errorMessage(err)));
      toast.show(es.detail.deleted);
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <article className={`detail${embedded ? ' detail--embedded' : ''}`}>
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

      <div className="detail__intro">
        <header className="detail__head">
          <p className="detail__meta">{metaLine(bake)}</p>
          <div className="detail__title-row">
            <h1 className="detail__title">{bake.name}</h1>
            <RatingDisplay value={bake.rating} />
          </div>
        </header>

        <dl className="figures">
          <div className="figures__item">
            <dt>{es.detail.hydration}</dt>
            <dd className="figures__big">{formatPct(bake.recipe.hydration)}</dd>
          </div>
          <div className="figures__item">
            <dt>{es.detail.dough}</dt>
            <dd>{formatGrams(totalDoughWeight(bake.recipe))}</dd>
          </div>
        </dl>

        {confirming ? (
          <ConfirmInline
            title={es.detail.deleteTitle(bake.name)}
            body={es.detail.deleteBody(bake.photoIds.length)}
            busy={busy}
            onCancel={() => setConfirming(false)}
            onConfirm={() => void remove()}
          />
        ) : (
          <div className="detail__actions">
            <Link to={`/bake/${bake.id}/edit`} className="action">
              <IconEdit size={20} />
              {es.common.edit}
            </Link>
            <button
              type="button"
              className="action action--danger"
              onClick={() => setConfirming(true)}
            >
              <IconTrash size={20} />
              {es.common.delete}
            </button>
          </div>
        )}
      </div>

      <div className="detail__body">
        <section id="sec-notas" className="detail__section">
          <h2 className="section-title">
            <span className="section-title__num">I.</span>
            {es.detail.sectionNotes}
          </h2>
          {bake.notes.trim() ? (
            <p className="ruled">{bake.notes}</p>
          ) : (
            <p className="muted-italic">{es.detail.noNotes}</p>
          )}
        </section>
      </div>
    </article>
  );
}
