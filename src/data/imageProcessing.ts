// In-browser photo compression: createImageBitmap (respects EXIF orientation) +
// canvas → WebP. No Cloud Storage: the result is stored as Firestore Bytes.

import { es } from '../i18n/es';
import { AppError } from './errors';

const MAX_SIDE = 1200;
const TARGET_BYTES = 400 * 1024;
const HARD_LIMIT = 900 * 1024;
const QUALITIES = [0.82, 0.72, 0.62, 0.5];
const SCALES = [1, 0.85, 0.7, 0.55, 0.4];
const THUMB_SIDE = 240;

export interface CompressedImage {
  data: Uint8Array;
  width: number;
  height: number;
  /** Square ~240px thumbnail as a data URL. */
  thumb: string;
}

async function decode(source: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(source, { imageOrientation: 'from-image' });
  } catch {
    throw new AppError(es.errors.photoUnreadable);
  }
}

function canvasFor(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (!b) return reject(new AppError(es.errors.photoUnreadable));
        // Browsers without WebP encoding (older Safari) fall back to PNG; use JPEG then.
        if (b.type === 'image/webp') return resolve(b);
        canvas.toBlob(
          (j) => (j ? resolve(j) : reject(new AppError(es.errors.photoUnreadable))),
          'image/jpeg',
          quality,
        );
      },
      'image/webp',
      quality,
    );
  });
}

function draw(
  bitmap: ImageBitmap,
  w: number,
  h: number,
  sx = 0,
  sy = 0,
  sw = bitmap.width,
  sh = bitmap.height,
) {
  const canvas = canvasFor(w, h);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new AppError(es.errors.photoUnreadable);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, w, h);
  return canvas;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

async function thumbFrom(bitmap: ImageBitmap): Promise<string> {
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;
  const out = Math.min(THUMB_SIDE, side);
  const canvas = draw(bitmap, out, out, sx, sy, side, side);
  return blobToDataUrl(await toBlob(canvas, 0.7));
}

/**
 * Resizes to 1200 px on the long side and encodes WebP, lowering quality and
 * then size until it fits (aim ≤ 400 KB, never above 900 KB).
 */
export async function compressImage(file: Blob): Promise<CompressedImage> {
  const bitmap = await decode(file);
  try {
    const long = Math.max(bitmap.width, bitmap.height);
    const base = Math.min(1, MAX_SIDE / long);
    let fallback: { blob: Blob; w: number; h: number } | null = null;

    outer: for (const s of SCALES) {
      const w = Math.max(1, Math.round(bitmap.width * base * s));
      const h = Math.max(1, Math.round(bitmap.height * base * s));
      const canvas = draw(bitmap, w, h);
      for (const q of QUALITIES) {
        const blob = await toBlob(canvas, q);
        if (blob.size <= TARGET_BYTES) {
          fallback = { blob, w, h };
          break outer;
        }
        if (blob.size <= HARD_LIMIT && !fallback) fallback = { blob, w, h };
      }
      if (fallback) break;
    }
    if (!fallback) throw new AppError(es.errors.photoTooLarge);

    const data = new Uint8Array(await fallback.blob.arrayBuffer());
    return { data, width: fallback.w, height: fallback.h, thumb: await thumbFrom(bitmap) };
  } finally {
    bitmap.close();
  }
}

/** Thumbnail for a photo already stored (e.g. when it becomes the cover). */
export async function thumbForStored(data: Uint8Array): Promise<string> {
  const bitmap = await decode(imageBlob(data));
  try {
    return await thumbFrom(bitmap);
  } finally {
    bitmap.close();
  }
}

/** Blob with the right type, sniffed from the bytes (WebP, or JPEG fallback). */
export function imageBlob(data: Uint8Array): Blob {
  const isJpeg = data[0] === 0xff && data[1] === 0xd8;
  return new Blob([data as Uint8Array<ArrayBuffer>], {
    type: isJpeg ? 'image/jpeg' : 'image/webp',
  });
}
