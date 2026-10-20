import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import { getDoc } from 'firebase/firestore';
import { isPermissionDenied } from './errors';
import { getFirebaseAuth } from './firebase';
import { userDoc } from './paths';

export type { User };

const provider = () => {
  const p = new GoogleAuthProvider();
  p.setCustomParameters({ prompt: 'select_account' });
  return p;
};

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

/** Popup first; redirect when the popup is blocked or unsupported (mobile, installed PWA). */
export async function signIn(): Promise<void> {
  const auth = getFirebaseAuth();
  if (isStandalone()) {
    await signInWithRedirect(auth, provider());
    return;
  }
  try {
    await signInWithPopup(auth, provider());
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (
      code === 'auth/popup-blocked' ||
      code === 'auth/operation-not-supported-in-this-environment'
    ) {
      await signInWithRedirect(auth, provider());
      return;
    }
    throw err;
  }
}

/** Resolves a pending redirect sign-in (no-op otherwise). */
export async function completeRedirect(): Promise<void> {
  await getRedirectResult(getFirebaseAuth());
}

export function watchAuth(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(getFirebaseAuth(), cb);
}

export function signOut(): Promise<void> {
  return fbSignOut(getFirebaseAuth());
}

export interface Profile {
  presetsSeeded?: boolean;
}

/**
 * Reads the user's profile doc. Firestore rules only let the allowed UID in, so a
 * permission error means "this account has no access". When offline the cached
 * copy (or nothing) is returned and access is assumed.
 */
export async function checkAccess(
  uid: string,
): Promise<{ allowed: boolean; profile: Profile | null }> {
  try {
    const snap = await getDoc(userDoc(uid));
    return { allowed: true, profile: (snap.data() as Profile | undefined) ?? {} };
  } catch (err) {
    if (isPermissionDenied(err)) return { allowed: false, profile: null };
    // Offline and not cached: assume access; the profile is unknown.
    return { allowed: true, profile: null };
  }
}
