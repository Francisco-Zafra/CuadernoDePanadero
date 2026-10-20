import { useEffect, useId, useRef } from 'react';
import { es } from '../i18n/es';

interface Props {
  title: string;
  body?: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmation shown in place, inside the page (no modal). */
export function ConfirmInline({
  title,
  body,
  confirmLabel = es.common.delete,
  busy,
  onConfirm,
  onCancel,
}: Props) {
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => cancelRef.current?.focus(), []);

  return (
    <div
      className="confirm"
      role="alertdialog"
      aria-labelledby={titleId}
      onKeyDown={(e) => e.key === 'Escape' && onCancel()}
    >
      <p id={titleId} className="confirm__title">
        {title}
      </p>
      {body && <p className="confirm__body">{body}</p>}
      <div className="confirm__actions">
        <button ref={cancelRef} type="button" className="btn btn--ghost" onClick={onCancel}>
          {es.common.cancel}
        </button>
        <button type="button" className="btn btn--danger" onClick={onConfirm} disabled={busy}>
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
