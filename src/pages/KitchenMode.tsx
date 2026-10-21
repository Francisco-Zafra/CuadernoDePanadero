import { useState, type KeyboardEvent } from 'react';
import { Link, useParams } from 'react-router';
import { stepDetail } from '../components/bakeText';
import { IconClose } from '../components/Icons';
import { WeighTable } from '../components/WeighTable';
import { prefermentName } from '../domain/defaults';
import { formatDuration, formatHours } from '../domain/format';
import { useBake } from '../hooks/useBake';
import { useWakeLock } from '../hooks/useWakeLock';
import { es } from '../i18n/es';

type Tab = 'recipe' | 'process';
const TABS: Tab[] = ['recipe', 'process'];

/** Large-type grams and steps in two tabs, with the screen kept on. */
export function KitchenMode() {
  const { id } = useParams();
  const { bake, loading } = useBake(id);
  const [keepAwake, setKeepAwake] = useState(true);
  const [tab, setTab] = useState<Tab>('recipe');
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
  const pref = bake.recipe.preferment;
  const prefHours = pref.kind === 'none' ? null : formatHours(pref.hours || null);

  // Arrow keys move between tabs, as in a regular tablist.
  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const next = TABS[(TABS.indexOf(tab) + 1) % TABS.length]!;
    setTab(next);
    document.getElementById(`k-tab-${next}`)?.focus();
  };

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

      <div role="tablist" aria-label={es.kitchen.title} className="kitchen__tabs">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            id={`k-tab-${t}`}
            aria-selected={tab === t}
            aria-controls={`k-panel-${t}`}
            tabIndex={tab === t ? 0 : -1}
            className="kitchen__tab"
            onClick={() => setTab(t)}
            onKeyDown={onTabKey}
          >
            {t === 'recipe' ? es.kitchen.recipe : es.kitchen.process}
          </button>
        ))}
      </div>

      <div className="kitchen__body">
        {tab === 'recipe' ? (
          <section id="k-panel-recipe" role="tabpanel" aria-labelledby="k-tab-recipe">
            {bake.status === 'complete' ? (
              <>
                {prefHours && (
                  <p className="kitchen__hint">
                    {es.kitchen.prefBefore(prefermentName(pref), prefHours)}
                  </p>
                )}
                <WeighTable recipe={bake.recipe} kitchen />
              </>
            ) : (
              <p className="kitchen__hint">{es.recipe.noRecipe}</p>
            )}
          </section>
        ) : (
          <section id="k-panel-process" role="tabpanel" aria-labelledby="k-tab-process">
            {bake.process.length === 0 ? (
              <p className="kitchen__hint">{es.process.empty}</p>
            ) : (
              <>
                <p className="kitchen__hint">{es.kitchen.tapWhenDone}</p>
                <ol className="kitchen__steps">
                  {bake.process.map((s, i) => {
                    const isDone = done.includes(s.id);
                    const isNow = i === nowIndex;
                    const detail = isNow ? stepDetail(s) : '';
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
              </>
            )}
          </section>
        )}
      </div>

      <footer className="kitchen__foot">
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
      </footer>
    </div>
  );
}
