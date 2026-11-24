import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { User, UserRole } from '../types/auth';
import { isAdminEmail } from '../utils/adminAuth';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function registerWithFirebase(
  email: string,
  pass: string,
  name: string,
  role: UserRole = 'Citoyen / Usager',
  country = "Côte d'Ivoire"
): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  const uid = cred.user.uid;
  const isAdmin = isAdminEmail(email);

  const userProfile: User = {
    id: uid,
    email,
    name,
    role: isAdmin ? 'Administrateur' : role,
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
  const resolvedEmail = cred.user.email || email;
  const isAdmin = isAdminEmail(resolvedEmail);

  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const existing = userDoc.data() as User;
      return {
        ...existing,
        isAdmin: existing.isAdmin || isAdmin,
        role: isAdmin ? 'Administrateur' : existing.role,
      };
    }
  } catch (err) {
    console.warn('Could not read user profile from Firestore:', err);
  }

  return {
    id: uid,
    email: resolvedEmail,
    name: cred.user.displayName || resolvedEmail.split('@')[0],
    role: isAdmin ? 'Administrateur' : 'Citoyen / Usager',
    createdAt: new Date().toISOString(),
    isAdmin,
  };
}

export async function signInWithGoogle(): Promise<{ user: User; token: string }> {
  const cred = await signInWithPopup(auth, googleProvider);
  const fbUser = cred.user;
  const token = await fbUser.getIdToken();
  const email = fbUser.email || '';
  const isAdmin = isAdminEmail(email);

  let userProfile: User | null = null;
  try {
    const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
    if (userDoc.exists()) {
      const existing = userDoc.data() as User;
      userProfile = {
        ...existing,
        email: email || existing.email,
        isAdmin: existing.isAdmin || isAdmin,
        role: isAdmin ? 'Administrateur' : existing.role,
      };
    }
  } catch (err) {
    console.warn('Could not read Google user profile from Firestore:', err);
  }

  if (!userProfile) {
    userProfile = {
      id: fbUser.uid,
      email,
      name: fbUser.displayName || (email ? email.split('@')[0] : 'Membre Google'),
      role: isAdmin ? 'Administrateur' : 'Développeur local',
      country: "Côte d'Ivoire",
      createdAt: new Date().toISOString(),
      isAdmin,
    };
    try {
      await setDoc(doc(db, 'users', fbUser.uid), userProfile, { merge: true });
    } catch (err) {
      console.warn('Could not persist Google user profile to Firestore:', err);
    }
  }

  return { user: userProfile, token };
}

export async function sendFirebasePasswordReset(email: string): Promise<{ sent: boolean; code?: string }> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
    return { sent: true };
  } catch (err: any) {
    return { sent: false, code: err?.code || 'unknown' };
  }
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
    const email = fbUser.email || '';
    const isAdmin = isAdminEmail(email);

    try {
      const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
      if (userDoc.exists()) {
        const existing = userDoc.data() as User;
        callback(
          {
            ...existing,
            isAdmin: existing.isAdmin || isAdmin,
            role: isAdmin ? 'Administrateur' : existing.role,
          },
          token
        );
        return;
      }
    } catch (e) {
      console.warn('Could not fetch user profile from Firestore:', e);
    }

    callback(
      {
        id: fbUser.uid,
        email,
        name: fbUser.displayName || (email ? email.split('@')[0] : 'Utilisateur'),
        role: isAdmin ? 'Administrateur' : 'Citoyen / Usager',
        createdAt: new Date().toISOString(),
        isAdmin,
      },
      token
    );
  });
}
