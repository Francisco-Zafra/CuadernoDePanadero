import { useId, type ReactNode } from 'react';
import { es } from '../i18n/es';
import { IconChevronRight } from './Icons';

interface Props {
  /** One-line summary shown on the bar, open or closed. */
  summary: ReactNode;
  open: boolean;
  onToggle: () => void;
  className?: string;
  children: ReactNode;
}

/** Collapsible block: a summary bar with Editar/Cerrar that reveals the controls. */
export function Fold({ summary, open, onToggle, className, children }: Props) {
  const id = useId();
  return (
    <div className={`fold${open ? ' fold--open' : ''}${className ? ` ${className}` : ''}`}>
      <button
        type="button"
        className="fold__bar"
        aria-expanded={open}
        aria-controls={id}
        onClick={onToggle}
      >
        <span className="fold__summary">{summary}</span>
        <span className="fold__action">
          {open ? es.common.close : es.common.edit}
          <IconChevronRight size={18} className="fold__chevron" />
        </span>
      </button>
      {open && (
        <div id={id} className="fold__body">
          {children}
        </div>
      )}
    </div>
  );
}
