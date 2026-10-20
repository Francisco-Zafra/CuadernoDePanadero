import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { errorMessage } from '../data/errors';
import * as prefRepo from '../data/prefermentsRepo';
import * as presetRepo from '../data/presetsRepo';
import { DEFAULT_PREFERMENTS, isBuiltinPreferment } from '../domain/defaults';
import type { Preset, SavedPreferment } from '../domain/types';
import { useAuth, useUid } from './useAuth';
import { useToast } from '../components/Toast';

interface CatalogState {
  preferments: SavedPreferment[];
  presets: Preset[];
  loading: boolean;
  savePreferment: (p: SavedPreferment) => void;
  deletePreferment: (id: string) => void;
  resetPreferment: (id: string) => void;
  savePreset: (p: Preset) => void;
  deletePreset: (id: string) => void;
  newPrefermentId: () => string;
  newPresetId: () => string;
  reload: () => Promise<void>;
}

const CatalogContext = createContext<CatalogState | null>(null);

/**
 * Presets and preferments: small collections read once per session (no listener)
 * and updated locally after each write.
 */
export function CatalogProvider({ children }: { children: ReactNode }) {
  const uid = useUid();
  const { profile } = useAuth();
  const toast = useToast();
  const [preferments, setPreferments] = useState<SavedPreferment[]>(prefRepo.mergeWithBuiltins([]));
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [prefs, pres] = await Promise.all([
      prefRepo.listPreferments(uid),
      presetRepo.listPresets(uid),
    ]);
    const seeded = pres.length === 0 && profile && !profile.presetsSeeded;
    return { prefs, presets: seeded ? presetRepo.seedDefaultPresets(uid) : pres };
  }, [uid, profile]);

  const apply = useCallback(
    (
      p: Promise<{ prefs: SavedPreferment[]; presets: Preset[] }>,
      isCancelled: () => boolean = () => false,
    ) =>
      p
        .then((data) => {
          if (isCancelled()) return;
          setPreferments(data.prefs);
          setPresets(data.presets);
        })
        .catch((err) => toast.error(errorMessage(err)))
        .finally(() => setLoading(false)),
    [toast],
  );

  const reload = useCallback(() => apply(load()), [apply, load]);

  useEffect(() => {
    let cancelled = false;
    void apply(load(), () => cancelled);
    return () => {
      cancelled = true;
    };
  }, [apply, load]);

  const report = useCallback(
    (p: Promise<unknown>) => {
      p.catch((err) => toast.error(errorMessage(err)));
    },
    [toast],
  );

  const value = useMemo<CatalogState>(
    () => ({
      preferments,
      presets,
      loading,
      reload,
      newPrefermentId: () => prefRepo.newPrefermentId(uid),
      newPresetId: () => presetRepo.newPresetId(uid),
      savePreferment: (p) => {
        setPreferments((list) =>
          prefRepo.mergeWithBuiltins([...list.filter((x) => x.id !== p.id), p]),
        );
        report(prefRepo.savePreferment(uid, p));
      },
      deletePreferment: (id) => {
        if (isBuiltinPreferment(id)) return;
        setPreferments((list) => list.filter((x) => x.id !== id));
        report(prefRepo.deletePreferment(uid, id));
      },
      resetPreferment: (id) => {
        if (!isBuiltinPreferment(id)) return;
        setPreferments((list) =>
          prefRepo.mergeWithBuiltins([...list.filter((x) => x.id !== id), DEFAULT_PREFERMENTS[id]]),
        );
        report(prefRepo.deletePreferment(uid, id));
      },
      savePreset: (p) => {
        setPresets((list) =>
          [...list.filter((x) => x.id !== p.id), p].sort((a, b) =>
            a.name.localeCompare(b.name, 'es'),
          ),
        );
        report(presetRepo.savePreset(uid, p));
      },
      deletePreset: (id) => {
        setPresets((list) => list.filter((x) => x.id !== id));
        report(presetRepo.deletePreset(uid, id));
      },
    }),
    [preferments, presets, loading, reload, uid, report],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogState {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used inside <CatalogProvider>');
  return ctx;
}
