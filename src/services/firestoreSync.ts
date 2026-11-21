import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  increment,
  arrayUnion,
  query,
  onSnapshot,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { AppIdea } from '../types/app';
import { SEED_APPS } from '../data/seedApps';

const APPS_COLLECTION = 'apps';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const message = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: message,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  if (message.includes('Missing or insufficient permissions') || message.includes('permission-denied')) {
    throw new Error(JSON.stringify(errInfo));
  }
}

export function sortApps(appsList: AppIdea[]): AppIdea[] {
  return [...appsList].sort((a, b) => {
    if (a.isDailyDrop && !b.isDailyDrop) return -1;
    if (!a.isDailyDrop && b.isDailyDrop) return 1;
    return (b.votes || 0) - (a.votes || 0);
  });
}

export function subscribeToFirestoreApps(callback: (apps: AppIdea[]) => void): () => void {
  try {
    const q = query(collection(db, APPS_COLLECTION));
    return onSnapshot(
      q,
      async (snapshot) => {
        if (snapshot.empty) {
          console.log('Firestore apps collection empty. Seeding initial African seed apps...');
          const promises = SEED_APPS.map((app) => setDoc(doc(db, APPS_COLLECTION, app.id), app));
          await Promise.all(promises);
          callback(sortApps(SEED_APPS));
          return;
        }

        const validApps: AppIdea[] = [];
        snapshot.forEach((d) => {
          const item = d.data() as AppIdea;
          if (item && item.id && item.title && item.sector && item.continent === 'Afrique') {
            validApps.push(item);
          }
        });

        if (validApps.length === 0) {
          callback(sortApps(SEED_APPS));
        } else {
          callback(sortApps(validApps));
        }
      },
      (error) => {
        console.warn('Firestore onSnapshot error, falling back:', error);
      }
    );
  } catch (error) {
    console.warn('Failed to subscribe to Firestore apps:', error);
    return () => {};
  }
}

export async function loadAppsFromFirestore(): Promise<AppIdea[]> {
  try {
    const q = query(collection(db, APPS_COLLECTION));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log('Seeding initial African apps into Firestore...');
      for (const app of SEED_APPS) {
        await setDoc(doc(db, APPS_COLLECTION, app.id), app);
      }
      return sortApps(SEED_APPS);
    }

    const apps: AppIdea[] = [];
    snapshot.forEach((d) => {
      const data = d.data() as AppIdea;
      if (data && data.id && data.title && data.sector && data.continent === 'Afrique') {
        apps.push(data);
      }
    });

    if (apps.length === 0) {
      return sortApps(SEED_APPS);
    }

    return sortApps(apps);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, APPS_COLLECTION);
    return [];
  }
}

export async function saveAppToFirestore(app: AppIdea): Promise<void> {
  if (app.continent !== 'Afrique') return;
  try {
    await setDoc(doc(db, APPS_COLLECTION, app.id), app, { merge: true });
    console.log(`App ${app.id} (${app.title}) successfully saved to Firestore!`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${APPS_COLLECTION}/${app.id}`);
  }
}

export async function saveMultipleAppsToFirestore(apps: AppIdea[]): Promise<void> {
  const africanApps = apps.filter((a) => a.continent === 'Afrique');
  try {
    await Promise.all(
      africanApps.map((app) => setDoc(doc(db, APPS_COLLECTION, app.id), app, { merge: true }))
    );
    console.log(`${africanApps.length} apps successfully saved to Firestore!`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, APPS_COLLECTION);
  }
}

export async function recordVoteInFirestore(appId: string, delta: number): Promise<void> {
  try {
    const ref = doc(db, APPS_COLLECTION, appId);
    await updateDoc(ref, {
      votes: increment(delta),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${APPS_COLLECTION}/${appId}`);
  }
}

export async function addPledgeToFirestore(appId: string, pledge: any): Promise<void> {
  try {
    const ref = doc(db, APPS_COLLECTION, appId);
    await updateDoc(ref, {
      devPledges: arrayUnion(pledge),
      status: 'Prototypage en cours',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${APPS_COLLECTION}/${appId}`);
  }
}

export async function addCommentToFirestore(appId: string, comment: any): Promise<void> {
  try {
    const ref = doc(db, APPS_COLLECTION, appId);
    await updateDoc(ref, {
      comments: arrayUnion(comment),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${APPS_COLLECTION}/${appId}`);
  }
}
