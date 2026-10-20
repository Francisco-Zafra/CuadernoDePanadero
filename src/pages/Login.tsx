import { useState } from 'react';
import { IconGoogle } from '../components/Icons';
import { useAuth } from '../hooks/useAuth';
import { es } from '../i18n/es';

export function Login() {
  const { signIn, signingIn, error } = useAuth();
  return (
    <div className="login">
      <div className="login__margin" aria-hidden="true" />
      <div className="login__intro">
        <p className="kicker">{es.login.kicker}</p>
        <h1 className="login__title">
          {es.login.titleTop}
          <br />
          <span className="login__title-it">{es.login.titleBottom}</span>
        </h1>
        <p className="login__lead">{es.login.lead}</p>
      </div>
      <div className="login__actions">
        {error && (
          <p className="notice" role="alert">
            {error}
          </p>
        )}
        <button
          type="button"
          className="btn btn--outline btn--xl"
          onClick={() => void signIn()}
          disabled={signingIn}
        >
          <IconGoogle />
          {signingIn ? es.login.signingIn : es.login.google}
        </button>
        <p className="login__foot">{es.login.footnote}</p>
      </div>
    </div>
  );
}

export function NoAccess() {
  const { user, signOut } = useAuth();
  const [copied, setCopied] = useState(false);
  if (!user) return null;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(user.uid);
      setCopied(true);
    } catch {
      // Clipboard blocked: the UID is visible and selectable anyway.
    }
  };
  return (
    <div className="login">
      <div className="login__margin" aria-hidden="true" />
      <div className="login__intro">
        <p className="kicker">{es.appName}</p>
        <h1 className="page-title">{es.login.noAccessTitle}</h1>
        <p className="login__lead">{es.login.noAccessBody(user.email ?? '')}</p>
        <p className="login__hint">{es.login.noAccessHint}</p>
        <div className="uid">
          <span className="field-label">{es.login.uidLabel}</span>
          <code className="uid__value">{user.uid}</code>
          <button type="button" className="link-btn" onClick={() => void copy()}>
            {copied ? es.login.copied : es.login.copyUid}
          </button>
        </div>
      </div>
      <div className="login__actions">
        <button type="button" className="btn btn--outline btn--xl" onClick={() => void signOut()}>
          {es.login.otherAccount}
        </button>
      </div>
    </div>
  );
}

export function ConfigMissing() {
  return (
    <div className="login">
      <div className="login__margin" aria-hidden="true" />
      <div className="login__intro">
        <p className="kicker">{es.appName}</p>
        <h1 className="page-title">{es.login.configMissingTitle}</h1>
        <p className="login__lead">{es.login.configMissingBody}</p>
      </div>
    </div>
  );
}

export function FullPageLoading() {
  return (
    <div className="full-loading" aria-busy="true">
      <span className="full-loading__brand">{es.appName}</span>
      <span className="sr-only">{es.common.loading}</span>
    </div>
  );
}
