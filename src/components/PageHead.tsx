import type { ReactNode } from 'react';

/** Page title with the double rule below. */
export function PageHead({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="page-head">
      <div className="page-head__row">
        <div className="page-head__titles">
          <h1 className="page-title">{title}</h1>
        </div>
        {children}
      </div>
      <div className="double-rule" aria-hidden="true" />
    </header>
  );
}
