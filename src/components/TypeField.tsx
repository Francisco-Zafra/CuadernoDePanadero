import type { BakeType } from '../domain/types';
import { es } from '../i18n/es';

/** Pan / Pizza radio pair. */
export function TypeField({
  value,
  onChange,
}: {
  value: BakeType;
  onChange: (t: BakeType) => void;
}) {
  return (
    <fieldset className="field type-field">
      <legend className="field-label">{es.editor.type}</legend>
      <div className="radio-tabs">
        {(['bread', 'pizza'] as const).map((t) => (
          <label key={t} className="radio-tabs__item">
            <input
              type="radio"
              name="bake-type"
              checked={value === t}
              onChange={() => onChange(t)}
            />
            {es.types[t]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
