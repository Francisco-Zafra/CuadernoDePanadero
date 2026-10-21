import { es } from '../i18n/es';
import { FieldCell } from './FieldGrid';
import { Stepper } from './Stepper';
import { adaptiveStep } from './steps';

interface PrefValues {
  kind?: string;
  flourPct: number;
  hydration: number;
  yeastPct: number;
  hours: number | null;
  tempC: number | null;
}

interface Props<T extends PrefValues> {
  value: T;
  onChange: (v: T) => void;
  /** Hide hours and temperature (the calculator only needs the amounts). */
  compact?: boolean;
  /** Compact three-column grid instead of stepper rows. */
  grid?: boolean;
}

/** A preferment's values: flour %, hydration, yeast/seed, hours, temperature. */
export function PrefermentParams<T extends PrefValues>({
  value,
  onChange,
  compact,
  grid,
}: Props<T>) {
  const set = (patch: Partial<PrefValues>) => onChange({ ...value, ...patch });
  const seed = value.kind === 'sourdough' || ('id' in value && value.id === 'sourdough');
  const fields = [
    {
      key: 'flourPct',
      label: es.preferments.flourPct,
      short: es.preferments.flourPctShort,
      sub: es.preferments.flourPctSub,
      value: value.flourPct,
      onChange: (v: number) => set({ flourPct: v }),
      step: 5,
      min: 1,
      max: 100,
      decimals: 1,
      unit: '%',
    },
    {
      key: 'hydration',
      label: es.preferments.hydration,
      short: es.preferments.hydration,
      sub: es.preferments.hydrationSub,
      value: value.hydration,
      onChange: (v: number) => set({ hydration: v }),
      step: 5,
      min: 30,
      max: 200,
      decimals: 1,
      unit: '%',
    },
    {
      key: 'yeastPct',
      label: seed ? es.preferments.seed : es.preferments.yeast,
      short: seed ? es.preferments.seedShort : es.preferments.yeast,
      sub: es.preferments.yeastSub,
      value: value.yeastPct,
      onChange: (v: number) => set({ yeastPct: v }),
      step: adaptiveStep,
      min: 0,
      max: undefined,
      decimals: 2,
      unit: '%',
    },
    ...(compact
      ? []
      : [
          {
            key: 'hours',
            label: es.preferments.hours,
            short: es.preferments.hours,
            sub: es.preferments.hoursSub,
            value: value.hours ?? 0,
            onChange: (v: number) => set({ hours: v }),
            step: 1,
            min: 0,
            max: 96,
            decimals: 1,
            unit: 'h',
          },
          {
            key: 'tempC',
            label: es.preferments.temp,
            short: es.preferments.temp,
            sub: es.preferments.tempSub,
            value: value.tempC ?? 20,
            onChange: (v: number) => set({ tempC: v }),
            step: 1,
            min: 0,
            max: 45,
            decimals: 1,
            unit: '°C',
          },
        ]),
  ];

  if (grid)
    return (
      <div className="field-grid">
        {fields.map(({ key, short, value: v, onChange: change, min, max, decimals, unit }) => (
          <FieldCell
            key={key}
            label={short}
            value={v}
            onChange={change}
            min={min}
            max={max}
            decimals={decimals}
            unit={unit}
          />
        ))}
      </div>
    );

  return (
    <div className="steppers">
      {fields.map((f) => (
        <Stepper
          key={f.key}
          label={f.label}
          sub={f.sub}
          value={f.value}
          onChange={f.onChange}
          step={f.step}
          min={f.min}
          max={f.max}
          decimals={f.decimals}
          unit={f.unit}
        />
      ))}
    </div>
  );
}
