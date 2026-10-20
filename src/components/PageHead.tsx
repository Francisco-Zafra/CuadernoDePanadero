import type { ReactNode } from 'react';
import { es } from '../i18n/es';

/** Page title with the app name above and the double rule below. */
export function PageHead({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="page-head">
      <div className="page-head__row">
        <div className="page-head__titles">
          <p className="page-head__kicker">{es.appName}</p>
          <h1 className="page-title">{title}</h1>
        </div>
        {children}
      </div>
      <div className="double-rule" aria-hidden="true" />
    </header>
  );
}
