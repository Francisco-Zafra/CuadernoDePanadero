import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as authApi from '../data/auth';
import { errorMessage } from '../data/errors';
import { isFirebaseConfigured } from '../data/firebase';

export type AuthStatus =
  'unconfigured' | 'loading' | 'signedOut' | 'checking' | 'noAccess' | 'ready';

interface AuthState {
  status: AuthStatus;
  user: authApi.User | null;
  /** Profile doc; null when it could not be read (offline, first time). */
  profile: authApi.Profile | null;
  error: string | null;
  signingIn: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(
    isFirebaseConfigured ? 'loading' : 'unconfigured',
  );
  const [user, setUser] = useState<authApi.User | null>(null);
  const [profile, setProfile] = useState<authApi.Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    authApi.completeRedirect().catch((err) => setError(errorMessage(err)));
    let cancelled = false;
    const unsub = authApi.watchAuth(async (u) => {
      setUser(u);
      if (!u) {
        setStatus('signedOut');
        return;
      }
      setStatus('checking');
      const res = await authApi.checkAccess(u.uid);
      if (cancelled) return;
      setProfile(res.profile);
      setStatus(res.allowed ? 'ready' : 'noAccess');
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  const signIn = useCallback(async () => {
    setError(null);
    setSigningIn(true);
    try {
      await authApi.signIn();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSigningIn(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await authApi.signOut();
  }, []);

  const value = useMemo(
    () => ({ status, user, profile, error, signingIn, signIn, signOut }),
    [status, user, profile, error, signingIn, signIn, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/** UID of the signed-in, allowed user. Only use under the protected routes. */
export function useUid(): string {
  const { user } = useAuth();
  if (!user) throw new Error('useUid used without a signed-in user');
  return user.uid;
}
