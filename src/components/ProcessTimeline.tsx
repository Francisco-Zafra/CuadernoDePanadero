import { formatDuration } from '../domain/format';
import type { ProcessStep } from '../domain/types';
import { es } from '../i18n/es';
import { stepDetail } from './bakeText';

/** Read-only process: a vertical line with one dot per step. */
export function ProcessTimeline({ steps }: { steps: ProcessStep[] }) {
  if (steps.length === 0) return <p className="muted-italic">{es.process.empty}</p>;
  return (
    <ol className="timeline">
      {steps.map((s, i) => {
        const isPref = s.kind === 'preferment';
        const detail = stepDetail(s);
        return (
          <li
            key={s.id}
            className={`timeline__step${isPref ? ' is-pref' : ''}${i === steps.length - 1 ? ' is-last' : ''}`}
          >
            <span className="timeline__rail" aria-hidden="true">
              <span className="timeline__dot" />
            </span>
            <span className="timeline__body">
              {isPref && <span className="eyebrow eyebrow--crust">{es.process.prefTag}</span>}
              <span className="timeline__name">{s.label || es.process.kinds[s.kind]}</span>
              {detail && <span className="timeline__detail">{detail}</span>}
            </span>
            <span className="timeline__dur">
              {s.durationMin != null ? formatDuration(s.durationMin) : ''}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
