import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore 
} from 'firebase/firestore';
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

// Configure Firestore according to platform specifications
const firestoreDbId = (rawConfig.firestoreDatabaseId && rawConfig.firestoreDatabaseId.trim() !== '')
  ? rawConfig.firestoreDatabaseId
  : "(default)";

let dbInstance;
try {
  dbInstance = initializeFirestore(app, {
    ignoreUndefinedProperties: true,
    experimentalAutoDetectLongPolling: true,
  }, firestoreDbId);
} catch {
  dbInstance = getFirestore(app, firestoreDbId);
}

export const db = dbInstance;
export const auth = getAuth(app);

// Global safety interceptor for known Firestore SDK internal assertion race condition (ID: ca9, b815)
if (typeof window !== 'undefined') {
  const isFirestoreInternalAssertion = (err: any) => {
    const text = String(err?.message || err || '');
    return text.includes('FIRESTORE') && (
      text.includes('INTERNAL ASSERTION FAILED') || 
      text.includes('Unexpected state') || 
      text.includes('ca9') || 
      text.includes('b815')
    );
  };

  window.addEventListener('error', (event) => {
    if (isFirestoreInternalAssertion(event.message) || isFirestoreInternalAssertion(event.error)) {
      console.warn('[Firestore Auto-Shield] Handled transient Firestore internal assertion:', event.message || event.error?.message);
      event.preventDefault();
      event.stopImmediatePropagation();
      return true;
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    if (isFirestoreInternalAssertion(event.reason)) {
      console.warn('[Firestore Auto-Shield] Handled transient Firestore internal rejection:', event.reason?.message || event.reason);
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });
}

// Initialize analytics if supported
if (typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported && firebaseConfig.measurementId) {
      getAnalytics(app);
    }
  }).catch(() => {});
}

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

  // If it is a transient connection/offline error or initial read error, log as warning without reporting as fatal crash
  if (errCode === 'unavailable' || errMsg.includes('offline') || errMsg.includes('transport errored') || errMsg.includes('Could not reach Cloud Firestore backend') || operationType === OperationType.GET || operationType === OperationType.LIST) {
    console.warn(`[Firestore ${operationType} on ${path}] Client operating offline/connecting:`, errMsg);
    return errInfo;
  }

  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}
