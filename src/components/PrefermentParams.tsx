import { es } from '../i18n/es';
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
}

/** Steppers for a preferment's values: flour %, hydration, yeast/seed, hours, temperature. */
export function PrefermentParams<T extends PrefValues>({ value, onChange, compact }: Props<T>) {
  const set = (patch: Partial<PrefValues>) => onChange({ ...value, ...patch });
  const seed = value.kind === 'sourdough' || ('id' in value && value.id === 'sourdough');
  return (
    <div className="steppers">
      <Stepper
        label={es.preferments.flourPct}
        sub={es.preferments.flourPctSub}
        value={value.flourPct}
        onChange={(v) => set({ flourPct: v })}
        step={5}
        min={1}
        max={100}
        unit="%"
      />
      <Stepper
        label={es.preferments.hydration}
        sub={es.preferments.hydrationSub}
        value={value.hydration}
        onChange={(v) => set({ hydration: v })}
        step={5}
        min={30}
        max={200}
        unit="%"
      />
      <Stepper
        label={seed ? es.preferments.seed : es.preferments.yeast}
        sub={es.preferments.yeastSub}
        value={value.yeastPct}
        onChange={(v) => set({ yeastPct: v })}
        step={adaptiveStep}
        decimals={2}
        unit="%"
      />
      {!compact && (
        <>
          <Stepper
            label={es.preferments.hours}
            sub={es.preferments.hoursSub}
            value={value.hours ?? 0}
            onChange={(v) => set({ hours: v })}
            step={1}
            max={96}
            unit="h"
          />
          <Stepper
            label={es.preferments.temp}
            sub={es.preferments.tempSub}
            value={value.tempC ?? 20}
            onChange={(v) => set({ tempC: v })}
            step={1}
            max={45}
            unit="°C"
          />
        </>
      )}
    </div>
  );
}
