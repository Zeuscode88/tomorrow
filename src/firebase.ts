import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  doc,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const typedFirebaseConfig = firebaseConfig as typeof firebaseConfig & {
  firestoreDatabaseId?: string;
};

// Initialize Firebase client
export const app = initializeApp(typedFirebaseConfig);

// Initialize Authentication
export const auth = getAuth(app);

// Initialize Firestore with long-polling in browser to avoid WebChannel 10s timeouts behind proxies/iframes
let dbInstance: Firestore;
try {
  dbInstance =
    typeof window !== 'undefined'
      ? initializeFirestore(
          app,
          {
            experimentalForceLongPolling: true,
            experimentalLongPollingOptions: { timeoutSeconds: 15 },
          },
          typedFirebaseConfig.firestoreDatabaseId || undefined
        )
      : typedFirebaseConfig.firestoreDatabaseId
        ? getFirestore(app, typedFirebaseConfig.firestoreDatabaseId)
        : getFirestore(app);
} catch {
  dbInstance = typedFirebaseConfig.firestoreDatabaseId
    ? getFirestore(app, typedFirebaseConfig.firestoreDatabaseId)
    : getFirestore(app);
}

export const db = dbInstance;

// Validate connection per Firebase skill directive
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore direct client connection offline; falling back to backend API sync.');
    }
  }
}

testConnection();
