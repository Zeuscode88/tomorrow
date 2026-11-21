import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { User, UserRole } from '../types/auth';

const ADMIN_EMAIL = 'jonatha2ngs@gmail.com';

export async function registerWithFirebase(
  email: string,
  pass: string,
  name: string,
  role: UserRole = 'Citoyen / Usager',
  country = 'Afrique'
): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  const uid = cred.user.uid;
  const isAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const userProfile: User = {
    id: uid,
    email,
    name,
    role,
    country,
    createdAt: new Date().toISOString(),
    isAdmin,
  };

  try {
    await setDoc(doc(db, 'users', uid), userProfile);
  } catch (err) {
    console.warn('Could not write user profile to Firestore:', err);
  }

  return userProfile;
}

export async function loginWithFirebase(email: string, pass: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  const uid = cred.user.uid;
  const isAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as User;
    }
  } catch (err) {
    console.warn('Could not read user profile from Firestore:', err);
  }

  return {
    id: uid,
    email: cred.user.email || email,
    name: cred.user.displayName || email.split('@')[0],
    role: isAdmin ? 'Administrateur' : 'Citoyen / Usager',
    createdAt: new Date().toISOString(),
    isAdmin,
  };
}

export async function logoutFromFirebase(): Promise<void> {
  await signOut(auth);
}

export function subscribeToFirebaseAuthState(callback: (user: User | null, token: string | null) => void) {
  return onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
    if (!fbUser) {
      callback(null, null);
      return;
    }

    const token = await fbUser.getIdToken();
    const isAdmin = fbUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    try {
      const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
      if (userDoc.exists()) {
        callback(userDoc.data() as User, token);
        return;
      }
    } catch (e) {
      console.warn('Could not fetch user profile from Firestore:', e);
    }

    callback(
      {
        id: fbUser.uid,
        email: fbUser.email || '',
        name: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'Utilisateur'),
        role: isAdmin ? 'Administrateur' : 'Citoyen / Usager',
        createdAt: new Date().toISOString(),
        isAdmin,
      },
      token
    );
  });
}
