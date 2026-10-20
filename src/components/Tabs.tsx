interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  size?: 'md' | 'lg';
  className?: string;
}

/** Underlined toggle group (filters, presets, preferment kinds). */
export function Tabs<T extends string>({
  label,
  options,
  value,
  onChange,
  size = 'md',
  className,
}: Props<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`tabs tabs--${size}${className ? ` ${className}` : ''}`}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className="tabs__item"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
