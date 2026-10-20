import { collection, doc } from 'firebase/firestore';
import { getDb } from './firebase';

// Everything hangs from the user: users/{uid}/...
export type UserCollection = 'bakes' | 'photos' | 'preferments' | 'presets';

export const userDoc = (uid: string) => doc(getDb(), 'users', uid);
export const userCol = (uid: string, name: UserCollection) =>
  collection(getDb(), 'users', uid, name);
export const userItem = (uid: string, name: UserCollection, id: string) =>
  doc(getDb(), 'users', uid, name, id);
