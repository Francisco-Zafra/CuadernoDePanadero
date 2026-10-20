import type { ReactNode } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import {
  IconCalculator,
  IconJournal,
  IconPlus,
  IconSettings,
  IconStats,
} from '../components/Icons';
import { useAuth } from '../hooks/useAuth';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { es } from '../i18n/es';

const SECTIONS: { to: string; label: string; icon: (p: { size?: number }) => ReactNode }[] = [
  { to: '/', label: es.nav.journal, icon: IconJournal },
  { to: '/calculator', label: es.nav.calculator, icon: IconCalculator },
  { to: '/stats', label: es.nav.stats, icon: IconStats },
  { to: '/settings', label: es.nav.settings, icon: IconSettings },
];

/** Bake routes (detail, editor) belong to the journal section. */
function isActive(to: string, pathname: string): boolean {
  if (to === '/')
    return pathname === '/' || pathname.startsWith('/bake') || pathname.startsWith('/new');
  return pathname.startsWith(to);
}

/** Bottom bar on mobile, sidebar on desktop. */
export function Layout({ mobileNav = true }: { mobileNav?: boolean }) {
  const { user } = useAuth();
  const online = useOnlineStatus();
  const { pathname } = useLocation();

  return (
    <div className={`app${mobileNav ? ' app--with-nav' : ''}`}>
      {!online && (
        <p className="offline-bar" role="status">
          <span className="offline-bar__dot" aria-hidden="true" />
          {es.offline.banner}
        </p>
      )}

      <aside className="sidebar">
        <Link to="/" className="sidebar__brand">
          <span>{es.appNameTop}</span>
          <span className="sidebar__brand-it">{es.appNameBottom}</span>
        </Link>
        <Link to="/new" className="btn btn--primary btn--md">
          <IconPlus size={18} />
          {es.nav.newBake}
        </Link>
        <nav aria-label={es.nav.sections} className="sidebar__nav">
          {SECTIONS.map((s) => {
            const active = isActive(s.to, pathname);
            return (
              <Link
                key={s.to}
                to={s.to}
                className="sidebar__link"
                aria-current={active ? 'page' : undefined}
              >
                <s.icon size={20} />
                {s.label}
              </Link>
            );
          })}
        </nav>
        {user && (
          <span className="sidebar__user">
            {es.nav.signedInAs(user.displayName?.split(' ')[0] || user.email || '')}
          </span>
        )}
      </aside>

      <main id="main" className="app-main">
        <Outlet />
      </main>

      {mobileNav && (
        <nav aria-label={es.nav.sections} className="bottom-nav">
          {SECTIONS.map((s) => {
            const active = isActive(s.to, pathname);
            return (
              <Link
                key={s.to}
                to={s.to}
                className="bottom-nav__link"
                aria-current={active ? 'page' : undefined}
              >
                <s.icon size={24} />
                {s.label}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
