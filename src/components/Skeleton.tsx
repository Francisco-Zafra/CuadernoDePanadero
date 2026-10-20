import { es } from '../i18n/es';

/** Loading silhouettes for the journal list. */
export function SkeletonRows({ count = 4 }: { count?: number }) {
  return (
    <ul className="skeleton-list" aria-busy="true" aria-label={es.common.loading}>
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="skeleton-row">
          <span className="skeleton skeleton--thumb" />
          <span className="skeleton-row__lines">
            <span className="skeleton skeleton--title" />
            <span className="skeleton skeleton--line" />
            <span className="skeleton skeleton--short" />
          </span>
        </li>
      ))}
    </ul>
  );
}

export function SkeletonBlock({ height = 120 }: { height?: number }) {
  return <span className="skeleton skeleton--block" style={{ height }} aria-hidden="true" />;
}
