import type { Bake } from '../domain/types';
import { Silhouette } from './Icons';

/** List thumbnail: the stored base64 `thumb`, or a line silhouette. */
export function BakeThumb({
  bake,
  size,
  silhouette = 44,
}: {
  bake: Bake;
  size?: number;
  silhouette?: number;
}) {
  return (
    <span
      className="thumb"
      style={size ? { width: size, height: size } : undefined}
      aria-hidden="true"
    >
      {bake.thumb ? (
        <img src={bake.thumb} alt="" loading="lazy" decoding="async" />
      ) : (
        <Silhouette type={bake.type} size={silhouette} strokeWidth={silhouette > 60 ? 1.4 : 2} />
      )}
    </span>
  );
}
