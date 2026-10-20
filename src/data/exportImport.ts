// JSON export / import of everything under users/{uid}. Photos are optional
// (base64) because they make the file much bigger.

import { Bytes, writeBatch, type WriteBatch } from 'firebase/firestore';
import type { Bake, Preset, SavedPreferment } from '../domain/types';
import { es } from '../i18n/es';
import { bakeFromDoc, bakeToDoc } from './bakesRepo';
import { AppError } from './errors';
import { getDb } from './firebase';
import { isObj } from './normalize';
import { userItem } from './paths';
import { listAllPhotos, photoFromDoc, photoToDoc } from './photosRepo';
import { prefermentFromDoc, prefermentToDoc } from './prefermentsRepo';
import { presetFromDoc, presetToDoc } from './presetsRepo';

const FORMAT = 'cuaderno-de-masas';
const VERSION = 1;

interface ExportFile {
  format: typeof FORMAT;
  version: number;
  exportedAt: string;
  bakes: Record<string, unknown>[];
  preferments: Record<string, unknown>[];
  presets: Record<string, unknown>[];
  photos?: Record<string, unknown>[];
}

const iso = (d: Date) => d.toISOString();

function bakeToJson(b: Bake) {
  return { ...b, date: iso(b.date), createdAt: iso(b.createdAt), updatedAt: iso(b.updatedAt) };
}

function bytesToBase64(data: Uint8Array): string {
  let s = '';
  for (let i = 0; i < data.length; i += 0x8000) {
    s += String.fromCharCode(...data.subarray(i, i + 0x8000));
  }
  return btoa(s);
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function buildExport(
  uid: string,
  data: { bakes: Bake[]; preferments: SavedPreferment[]; presets: Preset[] },
  includePhotos: boolean,
): Promise<Blob> {
  const file: ExportFile = {
    format: FORMAT,
    version: VERSION,
    exportedAt: new Date().toISOString(),
    bakes: data.bakes.map(bakeToJson),
    preferments: data.preferments.map((p) => ({ ...p })),
    presets: data.presets.map((p) => ({ ...p })),
  };
  if (includePhotos) {
    const photos = await listAllPhotos(uid);
    file.photos = photos.map((p) => ({
      id: p.id,
      bakeId: p.bakeId,
      tag: p.tag,
      width: p.width,
      height: p.height,
      createdAt: iso(p.createdAt),
      data: bytesToBase64(p.data),
    }));
  }
  return new Blob([JSON.stringify(file)], { type: 'application/json' });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportFilename(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `cuaderno-de-masas-${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}.json`;
}

export interface ParsedImport {
  bakes: Bake[];
  preferments: SavedPreferment[];
  presets: Preset[];
  photos: { id: string; doc: ReturnType<typeof photoToDoc>; size: number }[];
}

const toDate = (v: unknown) => (typeof v === 'string' ? new Date(v) : v);

/** Validates and normalizes an export file. Throws a Spanish AppError if invalid. */
export function parseImport(text: string): ParsedImport {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new AppError(es.errors.importInvalid);
  }
  if (!isObj(raw) || raw.format !== FORMAT || !Array.isArray(raw.bakes)) {
    throw new AppError(es.errors.importInvalid);
  }
  const items = (v: unknown) => (Array.isArray(v) ? v.filter(isObj) : []);
  const withId = (o: Record<string, unknown>) => typeof o.id === 'string' && o.id.length > 0;

  const bakes = items(raw.bakes)
    .filter(withId)
    .map((b) =>
      bakeFromDoc(b.id as string, {
        ...b,
        date: toDate(b.date),
        createdAt: toDate(b.createdAt),
        updatedAt: toDate(b.updatedAt),
      }),
    );
  const preferments = items(raw.preferments)
    .filter(withId)
    .map((p) => prefermentFromDoc(p.id as string, p));
  const presets = items(raw.presets)
    .filter(withId)
    .map((p) => presetFromDoc(p.id as string, p));
  const photos = items(raw.photos)
    .filter((p) => withId(p) && typeof p.data === 'string')
    .map((p) => {
      const data = base64ToBytes(p.data as string);
      const photo = photoFromDoc(p.id as string, {
        ...p,
        data: Bytes.fromUint8Array(data),
        createdAt: undefined,
      });
      const created = toDate(p.createdAt);
      if (created instanceof Date && !isNaN(created.getTime())) photo.createdAt = created;
      return { id: photo.id, doc: photoToDoc(photo), size: data.byteLength };
    });
  return { bakes, preferments, presets, photos };
}

const MAX_OPS = 400;
const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Writes the import (same ids overwrite). Commits are queued locally in order;
 * the returned promise settles when the server acknowledges them.
 */
export function writeImport(uid: string, data: ParsedImport): Promise<void> {
  const db = getDb();
  const batches: WriteBatch[] = [];
  let batch = writeBatch(db);
  let ops = 0;
  let bytes = 0;
  const push = (size: number, apply: (b: WriteBatch) => void) => {
    if (ops > 0 && (ops >= MAX_OPS || bytes + size > MAX_BYTES)) {
      batches.push(batch);
      batch = writeBatch(db);
      ops = 0;
      bytes = 0;
    }
    apply(batch);
    ops++;
    bytes += size;
  };

  // Photos first, so bakes never point at missing photos.
  for (const p of data.photos) push(p.size, (b) => b.set(userItem(uid, 'photos', p.id), p.doc));
  for (const p of data.preferments)
    push(1024, (b) => b.set(userItem(uid, 'preferments', p.id), prefermentToDoc(p)));
  for (const p of data.presets)
    push(4096, (b) => b.set(userItem(uid, 'presets', p.id), presetToDoc(p)));
  for (const bk of data.bakes) {
    const { id, ...rest } = bk;
    push(32 * 1024, (b) => b.set(userItem(uid, 'bakes', id), bakeToDoc(rest)));
  }
  if (ops > 0) batches.push(batch);
  return Promise.all(batches.map((b) => b.commit())).then(() => undefined);
}
