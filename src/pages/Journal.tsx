import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { BakeGridItem } from '../components/BakeGridItem';
import { BakeRow } from '../components/BakeRow';
import { IconGrid, IconList, IconPlus, IconSearch, IconSort } from '../components/Icons';
import { PageHead } from '../components/PageHead';
import { SkeletonRows } from '../components/Skeleton';
import { Tabs } from '../components/Tabs';
import { prefermentName } from '../domain/defaults';
import type { Bake, BakeType } from '../domain/types';
import { useBakes } from '../hooks/useBakes';
import { SPLIT_QUERY, useMediaQuery } from '../hooks/useMediaQuery';
import { es } from '../i18n/es';
import { BakeDetail } from './BakeDetail';

type Filter = 'all' | BakeType;
type Sort = 'date' | 'rating';
type View = 'list' | 'grid';

const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

function searchText(b: Bake): string {
  return fold(
    [
      b.name,
      es.types[b.type],
      prefermentName(b.recipe.preferment),
      b.notes,
      ...b.recipe.flours.map((f) => f.name),
    ].join(' '),
  );
}

function readView(): View {
  try {
    return localStorage.getItem('journalView') === 'grid' ? 'grid' : 'list';
  } catch {
    return 'list';
  }
}

export function Journal({ selectedId }: { selectedId?: string }) {
  const { bakes, loading, error } = useBakes();
  const split = useMediaQuery(SPLIT_QUERY);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('date');
  const [view, setViewState] = useState<View>(readView);

  const setView = (v: View) => {
    setViewState(v);
    try {
      localStorage.setItem('journalView', v);
    } catch {
      // ignore
    }
  };

  const rows = useMemo(() => {
    const needle = fold(q.trim());
    let list = bakes.filter((b) => filter === 'all' || b.type === filter);
    if (needle) list = list.filter((b) => searchText(b).includes(needle));
    list = list.slice();
    if (sort === 'date') list.sort((a, b) => b.date.getTime() - a.date.getTime());
    else
      list.sort(
        (a, b) => (b.rating ?? -1) - (a.rating ?? -1) || b.date.getTime() - a.date.getTime(),
      );
    return list;
  }, [bakes, q, filter, sort]);

  const isEmpty = !loading && bakes.length === 0;
  const selected = split ? (bakes.find((b) => b.id === selectedId) ?? rows[0] ?? null) : null;

  const list = (
    <section
      className={`journal${split ? ' journal--split' : ''}`}
      aria-label={es.journal.listLabel}
    >
      <PageHead title={es.journal.title}>
        {!isEmpty && !split && (
          <div role="group" aria-label={es.journal.view} className="view-toggle">
            <button
              type="button"
              aria-label={es.journal.asList}
              aria-pressed={view === 'list'}
              onClick={() => setView('list')}
            >
              <IconList size={22} />
            </button>
            <button
              type="button"
              aria-label={es.journal.asGrid}
              aria-pressed={view === 'grid'}
              onClick={() => setView('grid')}
            >
              <IconGrid size={22} />
            </button>
          </div>
        )}
      </PageHead>

      {error && (
        <p className="notice" role="alert">
          {es.journal.loadError} {error}
        </p>
      )}

      {isEmpty ? (
        <EmptyJournal />
      ) : (
        <>
          <label className="search">
            <span className="sr-only">{es.journal.search}</span>
            <IconSearch size={20} />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={es.journal.searchPlaceholder}
            />
          </label>
          <div className="journal__controls">
            <Tabs
              label={es.filters.byType}
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: es.filters.all },
                { value: 'bread', label: es.filters.bread },
                { value: 'pizza', label: es.filters.pizza },
              ]}
            />
            <button
              type="button"
              className="sort-btn"
              onClick={() => setSort(sort === 'date' ? 'rating' : 'date')}
            >
              <span className="sort-btn__label">{es.journal.sort}</span>
              <span className="sort-btn__value">
                {sort === 'date' ? es.journal.sortDate : es.journal.sortRating}
              </span>
              <IconSort size={18} />
            </button>
          </div>

          {loading ? (
            <SkeletonRows />
          ) : rows.length === 0 ? (
            <p className="muted-italic journal__none">{es.journal.noResults}</p>
          ) : view === 'list' || split ? (
            <>
              <div className="list-head" aria-hidden="true">
                <span className="list-head__count">{es.journal.count(rows.length)}</span>
                <span className="num">{es.journal.colHydration}</span>
                <span className="num">{es.journal.colRating}</span>
              </div>
              <ul className="bake-list">
                {rows.map((b) => (
                  <BakeRow key={b.id} bake={b} selected={selected?.id === b.id} />
                ))}
              </ul>
            </>
          ) : (
            <ul className="bake-grid">
              {rows.map((b) => (
                <BakeGridItem key={b.id} bake={b} />
              ))}
            </ul>
          )}

          <Link to="/new" className="btn btn--primary btn--fab">
            <IconPlus size={20} />
            {es.nav.newBake}
          </Link>
        </>
      )}
    </section>
  );

  if (!split) return list;
  return (
    <div className="split">
      {list}
      <div className="split__detail">
        {selected ? (
          <BakeDetail bake={selected} embedded />
        ) : (
          !isEmpty && !loading && <p className="muted-italic">{es.journal.pickOne}</p>
        )}
      </div>
    </div>
  );
}

function EmptyJournal() {
  return (
    <div className="empty">
      <p className="empty__title">{es.journal.emptyTitle}</p>
      <p className="empty__body">{es.journal.emptyBody}</p>
      <div className="empty__lines" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="empty__actions">
        <Link to="/new/quick" className="btn btn--primary btn--lg">
          <IconPlus size={20} />
          {es.nav.newBake}
        </Link>
        <Link to="/calculator" className="text-link">
          {es.journal.emptyCalc}
        </Link>
      </div>
    </div>
  );
}
