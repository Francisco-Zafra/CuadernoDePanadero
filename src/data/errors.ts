import { es } from '../i18n/es';

/** Maps Firebase / app errors to a clear Spanish message with the fix. */
export function errorMessage(err: unknown): string {
  const code = typeof err === 'object' && err && 'code' in err ? String(err.code) : '';
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return es.errors.popupClosed;
    case 'auth/popup-blocked':
      return es.errors.popupBlocked;
    case 'auth/unauthorized-domain':
      return es.errors.unauthorizedDomain;
    case 'auth/network-request-failed':
      return es.errors.network;
    case 'permission-denied':
    case 'firestore/permission-denied':
      return es.errors.permissionDenied;
    case 'resource-exhausted':
    case 'firestore/resource-exhausted':
      return es.errors.quotaExceeded;
    case 'unavailable':
    case 'firestore/unavailable':
      return es.errors.unavailable;
    default:
      if (err instanceof AppError) return err.message;
      return es.common.unknownError;
  }
}

/** Error whose message is already user-facing Spanish copy. */
export class AppError extends Error {}

export function isPermissionDenied(err: unknown): boolean {
  const code = typeof err === 'object' && err && 'code' in err ? String(err.code) : '';
  return code === 'permission-denied' || code === 'firestore/permission-denied';
}
