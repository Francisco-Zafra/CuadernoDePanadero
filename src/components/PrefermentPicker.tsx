import { prefermentFrom } from '../domain/defaults';
import type { Preferment, SavedPreferment } from '../domain/types';
import { useCatalog } from '../hooks/useCatalog';
import { es } from '../i18n/es';
import { prefermentSummary } from './bakeText';
import { IconPlus } from './Icons';
import { PrefermentParams } from './PrefermentParams';

export interface NewCustom {
  id: string;
  save: boolean;
}

interface Props {
  value: Preferment;
  onChange: (p: Preferment) => void;
  /** A custom preferment being created in this form (not saved yet). */
  newCustom: NewCustom | null;
  onNewCustomChange: (c: NewCustom | null) => void;
}

function isSelected(value: Preferment, saved: SavedPreferment | 'none'): boolean {
  if (saved === 'none') return value.kind === 'none';
  if (value.kind === 'custom') return value.customId === saved.id;
  return value.kind === saved.id;
}

/** Radio list of preferments (none, built-ins, custom) plus the selected one's values. */
export function PrefermentPicker({ value, onChange, newCustom, onNewCustomChange }: Props) {
  const { preferments, newPrefermentId } = useCatalog();
  const isNew = newCustom != null && value.kind === 'custom' && value.customId === newCustom.id;

  const options: { key: string; name: string; desc: string; on: boolean; pick: () => void }[] = [
    {
      key: 'none',
      name: es.preferments.none,
      desc: es.preferments.oneBlock,
      on: isSelected(value, 'none'),
      pick: () => onChange({ ...value, kind: 'none' }),
    },
    ...preferments.map((p) => {
      const builtin = ['poolish', 'biga', 'sourdough'].includes(p.id);
      const summary = prefermentSummary(p, p.id === 'sourdough');
      return {
        key: p.id,
        name: p.name,
        desc: builtin ? summary : `${es.preferments.custom} · ${summary}`,
        on: isSelected(value, p),
        pick: () => onChange(prefermentFrom(p)),
      };
    }),
  ];
  if (newCustom && !preferments.some((p) => p.id === newCustom.id)) {
    options.push({
      key: newCustom.id,
      name: isNew ? value.name || es.preferments.newName : es.preferments.newName,
      desc: es.preferments.noteNew,
      on: isNew,
      pick: () =>
        onChange({
          kind: 'custom',
          customId: newCustom.id,
          name: es.preferments.newName,
          flourPct: 20,
          hydration: 100,
          yeastPct: 0.5,
          hours: 12,
          tempC: 20,
        }),
    });
  }

  const addCustom = () => {
    const id = newPrefermentId();
    onNewCustomChange({ id, save: true });
    onChange({
      kind: 'custom',
      customId: id,
      name: es.preferments.newName,
      flourPct: 20,
      hydration: 100,
      yeastPct: 0.5,
      hours: 12,
      tempC: 20,
    });
  };

  const note =
    value.kind === 'none'
      ? null
      : isNew
        ? es.preferments.noteNew
        : value.kind === 'custom'
          ? es.preferments.noteCustom
          : es.preferments.noteDefault(es.preferments[value.kind]);

  return (
    <div className="pref-picker">
      <fieldset className="radio-list">
        <legend className="sr-only">{es.preferments.pickerLabel}</legend>
        {options.map((o) => (
          <label key={o.key} className="radio-row">
            <input type="radio" name="preferment" checked={o.on} onChange={o.pick} />
            <span className="radio-row__text">
              <span className="radio-row__name">{o.name}</span>
              <span className="radio-row__desc">{o.desc}</span>
            </span>
          </label>
        ))}
      </fieldset>
      {!newCustom && (
        <button type="button" className="link-btn" onClick={addCustom}>
          <IconPlus size={18} />
          {es.preferments.custom}
        </button>
      )}

      {value.kind !== 'none' && (
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
          <PrefermentParams value={value} onChange={onChange} />
          {isNew && (
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
      )}
    </div>
  );
}
