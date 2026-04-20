import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface UserProfileDoc {
  cpfDigits?: string;
  displayName?: string;
  email?: string;
  updatedAt?: unknown;
  createdAt?: unknown;
}

export async function saveUserProfile(
  uid: string,
  data: { cpfDigits: string; displayName?: string; email?: string }
): Promise<void> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  await setDoc(
    ref,
    {
      cpfDigits: data.cpfDigits,
      displayName: data.displayName ?? null,
      email: data.email ?? null,
      updatedAt: serverTimestamp(),
      ...(snap.exists() ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true }
  );
}

export async function getUserProfile(uid: string): Promise<UserProfileDoc | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return snap.data() as UserProfileDoc;
}
