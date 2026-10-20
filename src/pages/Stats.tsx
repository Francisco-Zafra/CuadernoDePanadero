import { useMemo, useState } from 'react';
import { EvolutionChart, HydrationScatter, MonthBars, PrefermentRows } from '../components/charts';
import { PageHead } from '../components/PageHead';
import { SkeletonBlock } from '../components/Skeleton';
import { Tabs } from '../components/Tabs';
import { formatMonth, formatPct, formatRating } from '../domain/format';
import {
  byHydration,
  byPreferment,
  evolution,
  firstVsLast,
  inPeriod,
  perMonth,
  summarize,
  type Period,
} from '../domain/stats';
import { useBakes } from '../hooks/useBakes';
import { es } from '../i18n/es';

export function Stats() {
  const { bakes, loading } = useBakes();
  const [period, setPeriod] = useState<Period>('year');

  const data = useMemo(() => {
    const list = inPeriod(bakes, period);
    const hyd = byHydration(list);
    const bestHyd = hyd.reduce<(typeof hyd)[number] | null>(
      (a, p) => (!a || p.rating > a.rating ? p : a),
      null,
    );
    const months = perMonth(bakes);
    const topMonth = months.reduce((a, m) => (m.count > a.count ? m : a), months[0]!);
    return {
      list,
      summary: summarize(list),
      evo: evolution(list),
      fl: firstVsLast(list),
      hyd,
      bestHyd,
      prefs: byPreferment(list),
      months,
      topMonth,
      names: Object.fromEntries(list.map((b) => [b.id, b.name])),
    };
  }, [bakes, period]);

  const s = data.summary;
  const pctOrDash = (v: number | null) => (v == null ? '—' : formatPct(Math.round(v)));

  return (
    <div className="page page--wide stats">
      <PageHead title={es.stats.title} />
      <Tabs
        label={es.stats.period}
        value={period}
        onChange={setPeriod}
        options={[
          { value: 'year', label: es.stats.lastYear },
          { value: 'all', label: es.stats.all },
        ]}
      />

      {loading ? (
        <SkeletonBlock height={240} />
      ) : data.list.length === 0 ? (
        <p className="muted-italic stats__empty">{es.stats.empty}</p>
      ) : (
        <>
          <section aria-label={es.stats.summary} className="stats__summary">
            <dl className="tiles">
              <div className="tile">
                <dt>{es.stats.bakes}</dt>
                <dd className="tile__value">{s.count}</dd>
                <dd className="tile__sub">{es.stats.breadPizza(s.bread, s.pizza)}</dd>
              </div>
              <div className="tile">
                <dt>{es.stats.avgRating}</dt>
                <dd className="tile__value">{formatRating(s.avgRating)}</dd>
                {s.lastFiveAvg != null && (
                  <dd className="tile__sub">{es.stats.lastFive(formatRating(s.lastFiveAvg))}</dd>
                )}
              </div>
              <div className="tile">
                <dt>{es.stats.best}</dt>
                <dd className="tile__value">{formatRating(s.best?.rating ?? null)}</dd>
                {s.best && <dd className="tile__sub">{s.best.name}</dd>}
              </div>
              <div className="tile">
                <dt>{es.stats.avgHydration}</dt>
                <dd className="tile__value tile__value--crust">
                  {s.avgHydration == null ? '—' : Math.round(s.avgHydration)}
                  {s.avgHydration != null && <span className="tile__unit"> %</span>}
                </dd>
                <dd className="tile__sub">
                  {es.stats.hydrationSplit(
                    pctOrDash(s.avgHydrationByType.bread),
                    pctOrDash(s.avgHydrationByType.pizza),
                  )}
                </dd>
              </div>
            </dl>
          </section>

          <div className="stats__grid">
            <section aria-labelledby="evo-t" className="stats__section">
              <h2 id="evo-t" className="h2">
                {es.stats.evolution}
              </h2>
              {data.evo.length < 2 ? (
                <p className="hint">{es.stats.notEnough}</p>
              ) : (
                <>
                  <p className="stats__lead">
                    {data.fl
                      ? es.stats.evolutionLead(
                          formatRating(data.fl.first),
                          formatRating(data.fl.last),
                        )
                      : es.stats.evolutionShort}
                  </p>
                  <EvolutionChart points={data.evo} />
                  <div className="legend">
                    <span className="legend__item">
                      <span className="legend__line" aria-hidden="true" />
                      {es.stats.eachBake}
                    </span>
                    <span className="legend__item">
                      <span className="legend__line legend__line--accent" aria-hidden="true" />
                      {es.stats.movingAvg}
                    </span>
                  </div>
                </>
              )}
            </section>

            <section aria-labelledby="hyd-t" className="stats__section">
              <h2 id="hyd-t" className="h2">
                {es.stats.byHydration}
              </h2>
              {data.hyd.length < 2 ? (
                <p className="hint">{es.stats.notEnough}</p>
              ) : (
                <>
                  {data.bestHyd && (
                    <p className="stats__lead">
                      {es.stats.byHydrationLead(
                        formatPct(data.bestHyd.hydration),
                        formatRating(data.bestHyd.rating),
                      )}
                    </p>
                  )}
                  <HydrationScatter points={data.hyd} names={data.names} />
                  <div className="legend">
                    <span className="legend__item">
                      <span className="legend__dot" aria-hidden="true" />
                      {es.types.bread}
                    </span>
                    <span className="legend__item">
                      <span className="legend__dot legend__dot--ring" aria-hidden="true" />
                      {es.types.pizza}
                    </span>
                    <span className="legend__axis">{es.stats.hydrationAxis}</span>
                  </div>
                </>
              )}
            </section>

            <section aria-labelledby="pref-t" className="stats__section">
              <h2 id="pref-t" className="h2">
                {es.stats.byPreferment}
              </h2>
              {data.prefs.length === 0 ? (
                <p className="hint">{es.stats.notEnough}</p>
              ) : (
                <>
                  <p className="stats__lead">
                    {es.stats.byPrefermentLead(
                      data.prefs[0]!.name,
                      formatRating(data.prefs[0]!.mean),
                    )}
                  </p>
                  <PrefermentRows groups={data.prefs} />
                  <div className="legend">
                    <span className="legend__item">
                      <span className="legend__tick" aria-hidden="true" />
                      {es.stats.eachBake}
                    </span>
                    <span className="legend__item">
                      <span className="legend__dot legend__dot--crust" aria-hidden="true" />
                      {es.stats.mean}
                    </span>
                  </div>
                </>
              )}
            </section>

            <section aria-labelledby="mes-t" className="stats__section">
              <h2 id="mes-t" className="h2">
                {es.stats.perMonth}
              </h2>
              {data.topMonth.count > 0 && (
                <p className="stats__lead">
                  {es.stats.perMonthLead(
                    capitalize(formatMonth(new Date(data.topMonth.year, data.topMonth.month, 1))),
                  )}
                </p>
              )}
              <MonthBars months={data.months} />
            </section>
          </div>
        </>
      )}
    </div>
  );
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
