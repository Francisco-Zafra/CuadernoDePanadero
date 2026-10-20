import { useAuth } from '../hooks/useAuth';
import { useTheme, type ThemePref } from '../hooks/useTheme';
import { es } from '../i18n/es';
import { PageHead } from '../components/PageHead';

export function Settings() {
  const { user, signOut } = useAuth();
  const [theme, setTheme] = useTheme();

  return (
    <div className="page">
      <PageHead title={es.settings.title} />

      <section className="settings-section" aria-labelledby="theme-t">
        <h2 id="theme-t" className="h2">
          {es.settings.theme}
        </h2>
        <fieldset className="radio-tabs-field">
          <legend className="sr-only">{es.settings.themeLegend}</legend>
          <div className="radio-tabs radio-tabs--3">
            {(['auto', 'light', 'dark'] as ThemePref[]).map((t) => (
              <label key={t} className="radio-tabs__item">
                <input
                  type="radio"
                  name="theme"
                  checked={theme === t}
                  onChange={() => setTheme(t)}
                />
                {es.settings.themes[t]}
              </label>
            ))}
          </div>
        </fieldset>
        <p className="hint">{es.settings.themeNote}</p>
      </section>

      <section className="account" aria-label={es.settings.account}>
        <span className="account__who">
          <span className="account__name">{user?.displayName || user?.email}</span>
          <span className="hint">{es.settings.signedInWith}</span>
        </span>
        <button type="button" className="btn btn--outline btn--md" onClick={() => void signOut()}>
          {es.settings.signOut}
        </button>
      </section>
    </div>
  );
}
