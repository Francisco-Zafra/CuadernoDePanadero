import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { IconClose } from '../components/Icons';
import { WeighList } from '../components/WeighList';
import { formatDuration, formatTemp } from '../domain/format';
import { useBake } from '../hooks/useBake';
import { useWakeLock } from '../hooks/useWakeLock';
import { es } from '../i18n/es';

/** Large-type grams and steps, with the screen kept on. */
export function KitchenMode() {
  const { id } = useParams();
  const { bake, loading } = useBake(id);
  const [keepAwake, setKeepAwake] = useState(true);
  const [done, setDone] = useState<string[]>([]);
  const { supported } = useWakeLock(keepAwake);

  if (loading) return null;
  if (!bake) {
    return (
      <div className="page">
        <p className="notice">{es.errors.notFound}</p>
        <Link to="/" className="text-link">
          {es.detail.back}
        </Link>
      </div>
    );
  }

  const nowIndex = bake.process.findIndex((s) => !done.includes(s.id));
  const toggle = (sid: string) =>
    setDone((d) => (d.includes(sid) ? d.filter((x) => x !== sid) : [...d, sid]));

  return (
    <div className="kitchen" role="region" aria-label={es.kitchen.title}>
      <header className="kitchen__bar">
        <span className="kitchen__titles">
          <span className="kitchen__kicker">{es.kitchen.title}</span>
          <span className="kitchen__name">{bake.name}</span>
        </span>
        <Link to={`/bake/${bake.id}`} className="kitchen__exit">
          <IconClose size={20} />
          {es.kitchen.exit}
        </Link>
      </header>

      <div className="kitchen__body">
        {supported ? (
          <label className="kitchen__awake">
            <input
              type="checkbox"
              checked={keepAwake}
              onChange={(e) => setKeepAwake(e.target.checked)}
            />
            {es.kitchen.keepAwake}
          </label>
        ) : (
          <p className="kitchen__hint">{es.kitchen.keepAwakeUnsupported}</p>
        )}

        <section aria-labelledby="k-recipe" className="kitchen__section">
          <h2 id="k-recipe" className="kitchen__h2">
            {es.kitchen.recipe}
          </h2>
          {bake.status === 'complete' ? (
            <WeighList recipe={bake.recipe} kitchen />
          ) : (
            <p className="kitchen__hint">{es.recipe.noRecipe}</p>
          )}
        </section>

        {bake.process.length > 0 && (
          <section aria-labelledby="k-process" className="kitchen__section">
            <h2 id="k-process" className="kitchen__h2">
              {es.kitchen.process}
            </h2>
            <p className="kitchen__hint">{es.kitchen.tapWhenDone}</p>
            <ol className="kitchen__steps">
              {bake.process.map((s, i) => {
                const isDone = done.includes(s.id);
                const isNow = i === nowIndex;
                const detail = [formatTemp(s.tempC), s.note.trim()].filter(Boolean).join(' · ');
                return (
                  <li key={s.id}>
                    <label
                      className={`kitchen__step${isDone ? ' is-done' : ''}${isNow ? ' is-now' : ''}`}
                    >
                      <input type="checkbox" checked={isDone} onChange={() => toggle(s.id)} />
                      <span className="kitchen__step-text">
                        {isNow && <span className="kitchen__now">{es.kitchen.now}</span>}
                        <span className="kitchen__step-name">
                          {s.label || es.process.kinds[s.kind]}
                        </span>
                        {detail && <span className="kitchen__step-detail">{detail}</span>}
                      </span>
                      <span className="kitchen__step-dur">
                        {s.durationMin != null ? formatDuration(s.durationMin) : ''}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ol>
          </section>
        )}
      </div>
    </div>
  );
}
