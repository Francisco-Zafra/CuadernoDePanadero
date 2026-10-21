import { useState } from 'react';
import { prefermentFrom, prefermentName } from '../domain/defaults';
import { formatHours, formatPct } from '../domain/format';
import type { Preferment } from '../domain/types';
import { useCatalog } from '../hooks/useCatalog';
import { es } from '../i18n/es';
import { prefermentSummary } from './bakeText';
import { Fold } from './Fold';
import { IconPlus } from './Icons';
import { PrefermentParams } from './PrefermentParams';
import { Tabs } from './Tabs';

export interface NewCustom {
  id: string;
  save: boolean;
}

interface Props {
  id: string;
  headingClassName: string;
  value: Preferment;
  onChange: (p: Preferment) => void;
  /** A custom preferment being created in this form (not saved yet). Omit to disable creating one. */
  newCustom?: NewCustom | null;
  onNewCustomChange?: (c: NewCustom | null) => void;
  /** Only the amounts: no hours, temperature or notes (the calculator). */
  compact?: boolean;
}

const keyOf = (p: Preferment) => (p.kind === 'custom' ? (p.customId ?? 'custom') : p.kind);

const blankCustom = (id: string): Preferment => ({
  kind: 'custom',
  customId: id,
  name: es.preferments.newName,
  flourPct: 20,
  hydration: 100,
  yeastPct: 0.5,
  hours: 12,
  tempC: 20,
});

/** Preferment section: tabs (none, built-ins, custom) and the selected one's values in a grid. */
export function PrefermentPicker({
  id,
  headingClassName,
  value,
  onChange,
  newCustom = null,
  onNewCustomChange,
  compact,
}: Props) {
  const { preferments, newPrefermentId } = useCatalog();
  const [open, setOpen] = useState(false);
  const isNew = newCustom != null && value.kind === 'custom' && value.customId === newCustom.id;
  const key = keyOf(value);

  const options = [
    { value: 'none', label: es.preferments.none },
    ...preferments.map((p) => ({ value: p.id, label: p.name })),
  ];
  if (newCustom && !preferments.some((p) => p.id === newCustom.id))
    options.push({
      value: newCustom.id,
      label: isNew ? value.name || es.preferments.newName : es.preferments.newName,
    });
  // A bake can point at a preferment no longer offered (old sourdough, a deleted custom one).
  if (!options.some((o) => o.value === key))
    options.push({ value: key, label: prefermentName(value) });

  const pick = (id: string) => {
    if (id === key) return;
    if (id === 'none') return onChange({ ...value, kind: 'none' });
    if (newCustom && id === newCustom.id) return onChange(blankCustom(id));
    const saved = preferments.find((p) => p.id === id);
    if (saved) onChange(prefermentFrom(saved));
  };

  const addCustom = () => {
    const id = newPrefermentId();
    onNewCustomChange?.({ id, save: true });
    onChange(blankCustom(id));
    setOpen(true);
  };

  const note =
    compact || value.kind === 'none'
      ? null
      : isNew
        ? es.preferments.noteNew
        : value.kind === 'custom'
          ? es.preferments.noteCustom
          : es.preferments.noteDefault(es.preferments[value.kind]);

  const summary = es.preferments.summaryWithFlour(
    formatPct(value.flourPct),
    prefermentSummary(compact ? { ...value, hours: null } : value, value.kind === 'sourdough'),
  );
  const hours = formatHours(value.hours || null);
  const headNote =
    value.kind === 'none' ? es.preferments.direct : hours ? es.recipe.prefHoursBefore(hours) : null;

  return (
    <section className="form-section pref-picker" aria-labelledby={id}>
      <div className="section-head">
        <h2 id={id} className={headingClassName}>
          {es.preferments.sectionTitle}
        </h2>
        {headNote && <span className="section-note">{headNote}</span>}
      </div>
      <div className="pref-picker__row">
        <Tabs label={es.preferments.pickerLabel} value={key} onChange={pick} options={options} />
        {onNewCustomChange && !newCustom && (
          <button type="button" className="link-btn link-btn--sm" onClick={addCustom}>
            <IconPlus size={16} />
            {es.preferments.custom}
          </button>
        )}
      </div>

      {value.kind !== 'none' && (
        <Fold summary={summary} open={open} onToggle={() => setOpen(!open)}>
          <div className="pref-picker__params">
            {value.kind === 'custom' && (
              <label className="field">
                <span className="field-label">{es.preferments.name}</span>
                <input
                  className="input-title input-title--sm"
                  value={value.name ?? ''}
                  onChange={(e) => onChange({ ...value, name: e.target.value })}
                />
              </label>
            )}
            <PrefermentParams value={value} onChange={onChange} compact={compact} grid />
            {isNew && onNewCustomChange && (
              <label className="check">
                <input
                  type="checkbox"
                  checked={newCustom.save}
                  onChange={(e) => onNewCustomChange({ ...newCustom, save: e.target.checked })}
                />
                {es.preferments.saveToMine}
              </label>
            )}
            {note && <p className="hint">{note}</p>}
          </div>
        </Fold>
      )}
    </section>
  );
}
