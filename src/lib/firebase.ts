import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, getDocFromServer, doc } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import rawConfig from '../../firebase-applet-config.json';

const firebaseConfig = {
  projectId: rawConfig.projectId || "vai-vai-zone01",
  appId: rawConfig.appId || "1:1068624674135:web:cd268306c9a75a3c025212",
  apiKey: rawConfig.apiKey || "AIzaSyArE3dSx8A7yrrLC5DFZ22uwvvJIk_evkY",
  authDomain: rawConfig.authDomain || "vai-vai-zone01.firebaseapp.com",
  storageBucket: rawConfig.storageBucket || "vai-vai-zone01.firebasestorage.app",
  messagingSenderId: rawConfig.messagingSenderId || "1068624674135",
  measurementId: rawConfig.measurementId || "G-C4NWY50B5E",
};

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = (rawConfig.firestoreDatabaseId && rawConfig.firestoreDatabaseId.trim() !== '' && rawConfig.firestoreDatabaseId !== '(default)')
  ? getFirestore(app, rawConfig.firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);

// Initialize analytics if supported
if (typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported && firebaseConfig.measurementId) {
      getAnalytics(app);
    }
  }).catch(() => {});
}

// Test Firestore connection as per skill guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (error?.message?.includes('the client is offline') || error?.code === 'unavailable') {
      // Offline / reconnecting status is handled automatically by Firestore client
      console.warn("Firestore is operating with offline persistence until connection stabilizes.");
    } else {
      console.warn("Firestore connection check:", error?.message || error);
    }
  }
}
testConnection();

export enum OperationType {
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
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  const errCode = (error as any)?.code;
  
  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  console.error('Firestore Error: ', JSON.stringify(errInfo));

  // If it is a transient connection/offline error or permission read error on startup, log clearly without crashing React listeners
  if (errCode === 'unavailable' || errMsg.includes('offline') || errMsg.includes('transport errored') || operationType === OperationType.GET || operationType === OperationType.LIST) {
    console.warn(`[Firestore ${operationType} on ${path}] Error encountered:`, errMsg);
    return errInfo;
  }

  return errInfo;
}
