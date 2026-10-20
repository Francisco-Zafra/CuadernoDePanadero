// Small SVG/HTML charts for the stats page. Colors come from the design tokens
// (CSS variables), so they follow the light/dark theme.

import { useRef, useState, type ReactNode } from 'react';
import { RATING_MAX } from '../domain/defaults';
import { formatDate, formatPct, formatRating } from '../domain/format';
import type { EvolutionPoint, HydrationPoint, MonthCount, PrefermentGroup } from '../domain/stats';
import { es } from '../i18n/es';

const W = 350;
const PAD_L = 28;
const PAD_R = 8;
const PAD_T = 10;

const yTicks = Array.from({ length: RATING_MAX }, (_, i) => i + 1);

interface Tip {
  x: number;
  y: number;
  content: ReactNode;
}

/** Positions a tooltip over the chart in percent, so it scales with the SVG. */
function Tooltip({ tip }: { tip: Tip | null }) {
  if (!tip) return null;
  const left = (tip.x / W) * 100;
  return (
    <div
      className={`chart-tip${left > 60 ? ' chart-tip--left' : ''}`}
      style={{ left: `${left}%`, top: tip.y }}
      role="status"
    >
      {tip.content}
    </div>
  );
}

/** Nearest point to the pointer, in SVG units. */
function usePointer<T>(points: T[], pos: (p: T) => [number, number], maxDist = Infinity) {
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<T | null>(null);
  const onMove = (e: React.PointerEvent) => {
    const svg = ref.current;
    if (!svg) return;
    const box = svg.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * W;
    const y = ((e.clientY - box.top) / box.height) * Number(svg.viewBox.baseVal.height);
    let best: T | null = null;
    let bestD = maxDist;
    for (const p of points) {
      const [px, py] = pos(p);
      const d = maxDist === Infinity ? Math.abs(px - x) : Math.hypot(px - x, py - y);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    setHover(best);
  };
  return { ref, hover, onMove, onLeave: () => setHover(null) };
}

/* ---------- Rating over time ---------- */

export function EvolutionChart({ points }: { points: EvolutionPoint[] }) {
  const H = 170;
  const plotB = H - 22;
  const y = (r: number) => PAD_T + ((RATING_MAX - r) / (RATING_MAX - 1)) * (plotB - PAD_T);
  const x = (i: number) =>
    points.length === 1
      ? (PAD_L + W - PAD_R) / 2
      : PAD_L + 6 + (i * (W - PAD_L - PAD_R - 12)) / (points.length - 1);
  const pts = points.map((p, i) => ({ ...p, i, px: x(i), py: y(p.rating) }));
  const line = pts.map((p) => `${p.px.toFixed(1)} ${p.py.toFixed(1)}`).join(' L');
  const avg = pts.map((p) => `${p.px.toFixed(1)} ${y(p.avg).toFixed(1)}`).join(' L');
  const { ref, hover: h, onMove, onLeave } = usePointer(pts, (p) => [p.px, p.py]);

  return (
    <div className="chart">
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        className="chart__svg"
        role="img"
        aria-label={es.stats.evolutionAria(points.length)}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
      >
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={PAD_L} x2={W - PAD_R} y1={y(t)} y2={y(t)} className="chart__grid" />
            <text x={0} y={y(t) + 4} className="chart__label">
              {t}
            </text>
          </g>
        ))}
        {pts.length > 1 && <path d={`M${line}`} className="chart__line-thin" />}
        {pts.length > 1 && <path d={`M${avg}`} className="chart__line-accent" />}
        {pts.map((p) => (
          <circle key={p.i} cx={p.px} cy={p.py} r={4} className="chart__dot" />
        ))}
        {h && <line x1={h.px} x2={h.px} y1={PAD_T} y2={plotB} className="chart__cross" />}
        {h && <circle cx={h.px} cy={h.py} r={5.5} className="chart__dot chart__dot--active" />}
        {pts[0] && (
          <text x={PAD_L} y={H - 4} className="chart__label">
            {formatDate(pts[0].date)}
          </text>
        )}
        {pts.length > 1 && (
          <text x={W - PAD_R} y={H - 4} className="chart__label" textAnchor="end">
            {formatDate(pts[pts.length - 1]!.date)}
          </text>
        )}
      </svg>
      <Tooltip
        tip={
          h && {
            x: h.px,
            y: 0,
            content: (
              <>
                <span className="chart-tip__title">{formatDate(h.date)}</span>
                <span>
                  {es.result.rating}: <strong>{formatRating(h.rating)}</strong>
                </span>
                <span>
                  {es.stats.movingAvg}: {formatRating(h.avg)}
                </span>
              </>
            ),
          }
        }
      />
      <div className="sr-only">
        <table>
          <caption>{es.stats.evolution}</caption>
          <thead>
            <tr>
              <th>{es.editor.date}</th>
              <th>{es.result.rating}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p, i) => (
              <tr key={i}>
                <td>{formatDate(p.date)}</td>
                <td>{formatRating(p.rating)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Rating vs hydration ---------- */

export function HydrationScatter({
  points,
  names,
}: {
  points: HydrationPoint[];
  names: Record<string, string>;
}) {
  const H = 206;
  const plotB = H - 26;
  const hs = points.map((p) => p.hydration);
  const lo = Math.floor((Math.min(...hs) - 2) / 5) * 5;
  const hi = Math.ceil((Math.max(...hs) + 2) / 5) * 5;
  const span = Math.max(5, hi - lo);
  const x = (h: number) => PAD_L + 6 + ((h - lo) / span) * (W - PAD_L - PAD_R - 12);
  const y = (r: number) => PAD_T + ((RATING_MAX - r) / (RATING_MAX - 1)) * (plotB - PAD_T);
  const step = span > 30 ? 10 : 5;
  const xTicks: number[] = [];
  for (let v = lo; v <= hi; v += step) xTicks.push(v);
  const pts = points.map((p) => ({ ...p, px: x(p.hydration), py: y(p.rating) }));
  const { ref, hover: h, onMove, onLeave } = usePointer(pts, (p) => [p.px, p.py], 18);

  return (
    <div className="chart">
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        className="chart__svg"
        role="img"
        aria-label={es.stats.byHydrationAria}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
      >
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={PAD_L} x2={W - PAD_R} y1={y(t)} y2={y(t)} className="chart__grid" />
            <text x={0} y={y(t) + 4} className="chart__label">
              {t}
            </text>
          </g>
        ))}
        {xTicks.map((t) => (
          <text key={t} x={x(t)} y={H - 6} className="chart__label" textAnchor="middle">
            {t}
          </text>
        ))}
        {pts.map((p) => (
          <circle
            key={p.id}
            cx={p.px}
            cy={p.py}
            r={h?.id === p.id ? 6.5 : 5}
            className={p.type === 'bread' ? 'chart__dot-bread' : 'chart__dot-pizza'}
          />
        ))}
      </svg>
      <Tooltip
        tip={
          h && {
            x: h.px,
            y: Math.max(0, h.py - 70),
            content: (
              <>
                <span className="chart-tip__title">{names[h.id]}</span>
                <span>
                  {es.types[h.type]} · {formatPct(h.hydration)}
                </span>
                <span>
                  {es.result.rating}: <strong>{formatRating(h.rating)}</strong>
                </span>
              </>
            ),
          }
        }
      />
      <div className="sr-only">
        <table>
          <caption>{es.stats.byHydration}</caption>
          <thead>
            <tr>
              <th>{es.editor.name}</th>
              <th>{es.recipe.hydration}</th>
              <th>{es.result.rating}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.id}>
                <td>{names[p.id]}</td>
                <td>{formatPct(p.hydration)}</td>
                <td>{formatRating(p.rating)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Rating by preferment ---------- */

export function PrefermentRows({ groups }: { groups: PrefermentGroup[] }) {
  const left = (r: number) => `${(((r - 1) / (RATING_MAX - 1)) * 100).toFixed(1)}%`;
  return (
    <>
      <ul className="pref-rows">
        {groups.map((g) => (
          <li key={g.key} className="pref-rows__row">
            <span className="pref-rows__name">
              <span>{g.name}</span>
              <span className="pref-rows__n">{es.stats.rated(g.ratings.length)}</span>
            </span>
            <span className="pref-rows__track" aria-hidden="true">
              {g.ratings.map((r, i) => (
                <span
                  key={i}
                  className="pref-rows__tick"
                  style={{ left: left(r) }}
                  title={formatRating(r)}
                />
              ))}
              <span
                className="pref-rows__mean"
                style={{ left: left(g.mean) }}
                title={`${es.stats.mean}: ${formatRating(g.mean)}`}
              />
            </span>
            <span className="pref-rows__value">{formatRating(g.mean)}</span>
          </li>
        ))}
      </ul>
      <div className="pref-rows__axis" aria-hidden="true">
        <span />
        <span className="pref-rows__axis-track">
          {yTicks.map((t) => (
            <span key={t} style={{ left: left(t) }}>
              {t}
            </span>
          ))}
        </span>
        <span />
      </div>
    </>
  );
}

/* ---------- Bakes per month ---------- */

export function MonthBars({ months }: { months: MonthCount[] }) {
  const max = Math.max(1, ...months.map((m) => m.count));
  const label = months.map((m) => `${es.stats.monthInitials[m.month]} ${m.count}`).join(', ');
  return (
    <div className="months">
      <ol className="months__bars" role="img" aria-label={es.stats.perMonthAria(label)}>
        {months.map((m, i) => (
          <li key={`${m.year}-${m.month}`} title={`${m.month + 1}/${m.year}: ${m.count}`}>
            <span className="months__n">{m.count}</span>
            <span
              className={`months__bar${i === months.length - 1 ? ' is-current' : ''}`}
              style={{ height: `${(m.count / max) * 110}px` }}
            />
          </li>
        ))}
      </ol>
      <div className="months__labels" aria-hidden="true">
        {months.map((m) => (
          <span key={`${m.year}-${m.month}`}>{es.stats.monthInitials[m.month]}</span>
        ))}
      </div>
    </div>
  );
}
