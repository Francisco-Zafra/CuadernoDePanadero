import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { prefermentSummary } from '../components/bakeText';
import { ConfirmInline } from '../components/ConfirmInline';
import {
  IconChevronRight,
  IconDownload,
  IconEdit,
  IconPlus,
  IconTrash,
  IconUpload,
} from '../components/Icons';
import { PageHead } from '../components/PageHead';
import { PrefermentParams } from '../components/PrefermentParams';
import { useToast } from '../components/Toast';
import { errorMessage } from '../data/errors';
import {
  buildExport,
  downloadBlob,
  exportFilename,
  parseImport,
  writeImport,
  type ParsedImport,
} from '../data/exportImport';
import { DEFAULT_PREFERMENTS, isBuiltinPreferment, prefermentName } from '../domain/defaults';
import { formatGrams, formatPct } from '../domain/format';
import type { Preset, SavedPreferment } from '../domain/types';
import { useAuth, useUid } from '../hooks/useAuth';
import { useBakes } from '../hooks/useBakes';
import { useCatalog } from '../hooks/useCatalog';
import { useTheme, type ThemePref } from '../hooks/useTheme';
import { es } from '../i18n/es';

export function Settings() {
  const { user, signOut } = useAuth();
  const [theme, setTheme] = useTheme();

  return (
    <div className="page settings">
      <PageHead title={es.settings.title} />
      <PresetsSection />
      <PrefermentsSection />

      <section className="settings-section" aria-labelledby="theme-t">
        <h2 id="theme-t" className="h2">
          {es.settings.theme}
        </h2>
        <fieldset className="radio-tabs-field">
          <legend className="sr-only">{es.settings.themeLegend}</legend>
          <div className="radio-tabs radio-tabs--3">
            {(['auto', 'light', 'dark'] as ThemePref[]).map((t) => (
              <label key={t} className="radio-tabs__item">
                <input
                  type="radio"
                  name="theme"
                  checked={theme === t}
                  onChange={() => setTheme(t)}
                />
                {es.settings.themes[t]}
              </label>
            ))}
          </div>
        </fieldset>
        <p className="hint">{es.settings.themeNote}</p>
      </section>

      <DataSection />

      <section className="account" aria-label={es.settings.account}>
        <span className="account__who">
          <span className="account__name">{user?.displayName || user?.email}</span>
          <span className="hint">{es.settings.signedInWith}</span>
        </span>
        <button type="button" className="btn btn--outline btn--md" onClick={() => void signOut()}>
          {es.settings.signOut}
        </button>
      </section>
    </div>
  );
}

function presetDetail(p: Preset): string {
  const r = p.recipe;
  const pref =
    r.preferment.kind === 'none'
      ? null
      : `${prefermentName(r.preferment)} ${formatPct(r.preferment.flourPct)}`;
  return [
    pref,
    formatPct(r.hydration),
    `${es.recipe.salt.toLowerCase()} ${formatPct(r.salt)}`,
    `${r.pieces} × ${formatGrams(r.pieceWeight)}`,
  ]
    .filter(Boolean)
    .join(' · ');
}

function PresetsSection() {
  const { presets, deletePreset } = useCatalog();
  const [confirm, setConfirm] = useState<Preset | null>(null);
  return (
    <section className="settings-section" aria-labelledby="pre-t">
      <div className="section-head">
        <h2 id="pre-t" className="h2">
          {es.settings.presets}
        </h2>
        <Link to="/calculator" className="link-btn">
          <IconPlus size={16} />
          {es.settings.newPreset}
        </Link>
      </div>
      {presets.length === 0 ? (
        <p className="hint">{es.settings.noPresets}</p>
      ) : (
        <ul className="settings-list">
          {presets.map((p) => (
            <li key={p.id} className="settings-row">
              {confirm?.id === p.id ? (
                <ConfirmInline
                  title={es.settings.deletePresetConfirm(p.name)}
                  onCancel={() => setConfirm(null)}
                  onConfirm={() => {
                    deletePreset(p.id);
                    setConfirm(null);
                  }}
                />
              ) : (
                <div className="settings-row__main">
                  <Link to={`/calculator?preset=${p.id}`} className="settings-row__link">
                    <span className="settings-row__text">
                      <span className="settings-row__name">{p.name}</span>
                      <span className="settings-row__detail">{presetDetail(p)}</span>
                    </span>
                    <IconChevronRight size={18} />
                  </Link>
                  <button
                    type="button"
                    className="icon-btn icon-btn--danger"
                    aria-label={es.settings.deletePreset(p.name)}
                    onClick={() => setConfirm(p)}
                  >
                    <IconTrash size={20} />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PrefermentsSection() {
  const { preferments, savePreferment, deletePreferment, resetPreferment, newPrefermentId } =
    useCatalog();
  const toast = useToast();
  const [editing, setEditing] = useState<SavedPreferment | null>(null);
  const [confirm, setConfirm] = useState<SavedPreferment | null>(null);

  const startNew = () =>
    setEditing({
      id: newPrefermentId(),
      name: es.preferments.newName,
      flourPct: 20,
      hydration: 100,
      yeastPct: 0.5,
      hours: 12,
      tempC: 20,
    });

  const isNew = editing != null && !preferments.some((p) => p.id === editing.id);
  const rows = isNew ? [...preferments, editing] : preferments;

  return (
    <section className="settings-section" aria-labelledby="pf-t">
      <div className="section-head">
        <h2 id="pf-t" className="h2">
          {es.settings.preferments}
        </h2>
        {!isNew && (
          <button type="button" className="link-btn" onClick={startNew}>
            <IconPlus size={16} />
            {es.settings.newPreferment}
          </button>
        )}
      </div>
      <ul className="settings-list">
        {rows.map((p) => {
          const builtin = isBuiltinPreferment(p.id);
          if (editing?.id === p.id) {
            return (
              <li key={p.id} className="settings-row settings-row--edit">
                <PrefermentForm
                  value={editing}
                  builtin={builtin}
                  onChange={setEditing}
                  onCancel={() => setEditing(null)}
                  onSave={() => {
                    savePreferment({
                      ...editing,
                      name: editing.name.trim() || es.preferments.newName,
                    });
                    setEditing(null);
                    toast.show(es.settings.prefSaved);
                  }}
                  onReset={
                    builtin
                      ? () => {
                          resetPreferment(p.id);
                          setEditing(null);
                        }
                      : undefined
                  }
                />
              </li>
            );
          }
          if (confirm?.id === p.id) {
            return (
              <li key={p.id} className="settings-row">
                <ConfirmInline
                  title={es.settings.deletePrefermentConfirm(p.name)}
                  onCancel={() => setConfirm(null)}
                  onConfirm={() => {
                    deletePreferment(p.id);
                    setConfirm(null);
                  }}
                />
              </li>
            );
          }
          return (
            <li key={p.id} className="settings-row">
              <div className="settings-row__main">
                <span className="settings-row__text">
                  <span className="settings-row__title">
                    <span className="settings-row__name">{p.name}</span>
                    <span className="settings-row__tag">
                      {builtin ? es.preferments.builtin : es.preferments.customTag}
                    </span>
                  </span>
                  <span className="settings-row__detail">
                    {es.preferments.summaryWithFlour(
                      formatPct(p.flourPct),
                      prefermentSummary(p, p.id === 'sourdough'),
                    )}
                  </span>
                </span>
                <span className="settings-row__tools">
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={es.settings.editPreferment(p.name)}
                    onClick={() => setEditing({ ...p })}
                  >
                    <IconEdit size={20} />
                  </button>
                  {!builtin && (
                    <button
                      type="button"
                      className="icon-btn icon-btn--danger"
                      aria-label={es.settings.deletePreferment(p.name)}
                      onClick={() => setConfirm(p)}
                    >
                      <IconTrash size={20} />
                    </button>
                  )}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="hint">{es.settings.builtinNote}</p>
    </section>
  );
}

function PrefermentForm({
  value,
  builtin,
  onChange,
  onSave,
  onCancel,
  onReset,
}: {
  value: SavedPreferment;
  builtin: boolean;
  onChange: (p: SavedPreferment) => void;
  onSave: () => void;
  onCancel: () => void;
  onReset?: () => void;
}) {
  const defaults = isBuiltinPreferment(value.id) ? DEFAULT_PREFERMENTS[value.id] : null;
  const isDefault = defaults != null && JSON.stringify(value) === JSON.stringify(defaults);
  return (
    <div className="pref-form">
      {builtin ? (
        <p className="pref-form__name">{value.name}</p>
      ) : (
        <label className="field">
          <span className="field-label">{es.preferments.name}</span>
          <input
            className="input-title input-title--sm"
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
          />
        </label>
      )}
      <PrefermentParams
        value={{ ...value, kind: value.id }}
        onChange={({ kind: _k, ...v }) => onChange(v)}
      />
      <div className="confirm__actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          {es.common.cancel}
        </button>
        <button type="button" className="btn btn--primary" onClick={onSave}>
          {es.common.save}
        </button>
      </div>
      {onReset && !isDefault && (
        <button type="button" className="link-btn" onClick={onReset}>
          {es.settings.resetDefaults}
        </button>
      )}
    </div>
  );
}

function DataSection() {
  const uid = useUid();
  const toast = useToast();
  const { bakes } = useBakes();
  const catalog = useCatalog();
  const [includePhotos, setIncludePhotos] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [pending, setPending] = useState<ParsedImport | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const doExport = async () => {
    setExporting(true);
    try {
      const blob = await buildExport(
        uid,
        { bakes, preferments: catalog.preferments, presets: catalog.presets },
        includePhotos,
      );
      downloadBlob(blob, exportFilename());
      toast.show(es.settings.exported);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  const onFile = async (file: File) => {
    try {
      setPending(parseImport(await file.text()));
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const doImport = () => {
    if (!pending) return;
    const n = pending.bakes.length;
    // Writes reach the local cache right away; the promise settles on server ack.
    writeImport(uid, pending).catch((err) => toast.error(errorMessage(err)));
    void catalog.reload();
    setPending(null);
    toast.show(es.settings.imported(n));
  };

  return (
    <section className="settings-section" aria-labelledby="dat-t">
      <h2 id="dat-t" className="h2">
        {es.settings.data}
      </h2>
      <div className="data-actions">
        <button
          type="button"
          className="data-btn"
          onClick={() => void doExport()}
          disabled={exporting}
        >
          <IconDownload size={22} />
          <span className="data-btn__text">
            <span className="data-btn__title">
              {exporting ? es.settings.exporting : es.settings.export}
            </span>
            <span className="data-btn__sub">{es.settings.exportSub}</span>
          </span>
        </button>
        <label className="check data-actions__check">
          <input
            type="checkbox"
            checked={includePhotos}
            onChange={(e) => setIncludePhotos(e.target.checked)}
          />
          {es.settings.includePhotos}
        </label>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) void onFile(f);
          }}
        />
        {pending ? (
          <ConfirmInline
            title={es.settings.import}
            body={es.settings.importConfirm(pending.bakes.length)}
            confirmLabel={es.settings.import}
            onCancel={() => setPending(null)}
            onConfirm={doImport}
          />
        ) : (
          <button type="button" className="data-btn" onClick={() => fileInput.current?.click()}>
            <IconUpload size={22} />
            <span className="data-btn__text">
              <span className="data-btn__title">{es.settings.import}</span>
              <span className="data-btn__sub">{es.settings.importSub}</span>
            </span>
          </button>
        )}
      </div>
    </section>
  );
}
