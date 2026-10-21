import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { doughSummary, metaLine } from '../components/bakeText';
import { ConfirmInline } from '../components/ConfirmInline';
import { BakeHero, BakePhotos } from '../components/BakePhotos';
import { IconEdit, IconKitchen, IconRepeat, IconTrash } from '../components/Icons';
import { ProcessTimeline } from '../components/ProcessTimeline';
import { RatingDisplay } from '../components/Rating';
import { SectionNav } from '../components/SectionNav';
import { SkeletonBlock } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import { WeighTable } from '../components/WeighTable';
import { deleteBake } from '../data/bakesRepo';
import { errorMessage } from '../data/errors';
import { totalDoughWeight } from '../domain/bakersMath';
import { formatDate, formatDuration, formatGrams, formatPct } from '../domain/format';
import { totalDurationMin } from '../domain/process';
import type { Bake } from '../domain/types';
import { useUid } from '../hooks/useAuth';
import { useBake } from '../hooks/useBake';
import { useBakePhotos } from '../hooks/useBakePhotos';
import { useBakes } from '../hooks/useBakes';
import { SPLIT_QUERY, useMediaQuery } from '../hooks/useMediaQuery';
import { es } from '../i18n/es';
import { Journal } from './Journal';

/** Route /bake/:id — full page on mobile, list + detail on wide screens. */
export function BakeDetailPage() {
  const { id } = useParams();
  const split = useMediaQuery(SPLIT_QUERY);
  const { bake, loading } = useBake(id);
  if (split) return <Journal selectedId={id} />;
  if (loading) {
    return (
      <div className="page">
        <SkeletonBlock height={330} />
      </div>
    );
  }
  if (!bake) return <NotFound />;
  return <BakeDetail key={bake.id} bake={bake} />;
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

const SECTIONS = [
  { id: 'sec-receta', label: es.detail.sectionRecipe },
  { id: 'sec-proceso', label: es.detail.sectionProcess },
  { id: 'sec-fotos', label: es.detail.sectionPhotos },
  { id: 'sec-notas', label: es.detail.sectionNotes },
];

export function BakeDetail({ bake, embedded = false }: { bake: Bake; embedded?: boolean }) {
  const uid = useUid();
  const navigate = useNavigate();
  const toast = useToast();
  const { bakes } = useBakes();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const photos = useBakePhotos(uid, bake);

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

  // Quick notes carry a placeholder recipe until they are completed.
  const hasRecipe = bake.status === 'complete';
  const totalMin = totalDurationMin(bake.process);
  const source = bake.sourceBakeId ? bakes.find((b) => b.id === bake.sourceBakeId) : undefined;
  const nextItems = bake.nextTime
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const edited =
    bake.updatedAt.getTime() - bake.createdAt.getTime() > 60_000
      ? formatDate(bake.updatedAt)
      : null;

  const kitchenLink = (
    <Link to={`/bake/${bake.id}/kitchen`} className="section-nav__kitchen">
      <IconKitchen size={18} />
      {es.detail.kitchenShort}
    </Link>
  );

  return (
    <article className={`detail${embedded ? ' detail--embedded' : ''}`}>
      <BakeHero bake={bake} photos={photos} embedded={embedded} />

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
            <dd className="figures__big">{hasRecipe ? formatPct(bake.recipe.hydration) : '—'}</dd>
          </div>
          <div className="figures__item">
            <dt>{es.detail.dough}</dt>
            <dd>{hasRecipe ? formatGrams(totalDoughWeight(bake.recipe)) : '—'}</dd>
          </div>
          <div className="figures__item">
            <dt>{es.detail.process}</dt>
            <dd>{formatDuration(totalMin, true)}</dd>
          </div>
        </dl>

        {bake.status === 'incomplete' && (
          <div className="incomplete-note" role="status">
            <span>
              <span className="incomplete-note__title">{es.detail.incompleteTitle}</span>{' '}
              {es.detail.incompleteBody}
            </span>
            <Link to={`/bake/${bake.id}/edit`}>{es.detail.completeNow}</Link>
          </div>
        )}

        <Link
          to={`/bake/${bake.id}/kitchen`}
          className="btn btn--primary btn--block detail__kitchen"
        >
          <IconKitchen size={20} />
          {es.detail.kitchen}
        </Link>

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
            <Link to={`/bake/${bake.id}/repeat`} className="action">
              <IconRepeat size={20} />
              {es.detail.repeat}
            </Link>
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

      {!embedded && <SectionNav label={es.detail.sections} sections={SECTIONS} end={kitchenLink} />}

      <div className="detail__body">
        <div className="detail__cols">
          <section id="sec-receta" className="detail__section">
            <h2 className="section-title">
              <span className="section-title__num">I.</span>
              {es.detail.sectionRecipe}
            </h2>
            {hasRecipe ? (
              <>
                <p className="section-lead">{doughSummary(bake.recipe)}</p>
                <WeighTable recipe={bake.recipe} />
              </>
            ) : (
              <p className="muted-italic">{es.recipe.noRecipe}</p>
            )}
          </section>

          <section id="sec-proceso" className="detail__section">
            <h2 className="section-title">
              <span className="section-title__num">II.</span>
              {es.detail.sectionProcess}
            </h2>
            {totalMin != null && (
              <p className="section-lead">{es.process.total(formatDuration(totalMin))}</p>
            )}
            <ProcessTimeline steps={bake.process} />
          </section>
        </div>

        <section id="sec-fotos" className="detail__section">
          <h2 className="section-title">
            <span className="section-title__num">III.</span>
            {es.detail.sectionPhotos}
          </h2>
          <BakePhotos bake={bake} photos={photos} />
        </section>

        <div className="detail__cols">
          <section id="sec-notas" className="detail__section detail__section--notes">
            <h2 className="section-title">
              <span className="section-title__num">IV.</span>
              {es.detail.sectionNotes}
            </h2>
            {bake.notes.trim() ? (
              <p className="ruled">{bake.notes}</p>
            ) : (
              <p className="muted-italic">{es.detail.noNotes}</p>
            )}
          </section>
          {nextItems.length > 0 && (
            <section className="detail__section detail__section--next" aria-labelledby="next-t">
              <h3 id="next-t" className="h3">
                {es.result.nextTime}
              </h3>
              <ol className="next-list">
                {nextItems.map((t, i) => (
                  <li key={i}>
                    <span className="next-list__n">{i + 1}.</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        <p className="detail__foot">
          {es.detail.createdOn(formatDate(bake.createdAt), edited)}
          {source && (
            <>
              {' · '}
              {es.detail.fromBake} <Link to={`/bake/${source.id}`}>{source.name}</Link>
            </>
          )}
        </p>
      </div>
    </article>
  );
}
