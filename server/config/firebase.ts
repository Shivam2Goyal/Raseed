import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
let app;
if (getApps().length === 0) {
  // Check if we have Firebase credentials
  const firebaseConfig = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (firebaseConfig) {
    try {
      const serviceAccount = JSON.parse(firebaseConfig);
      app = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
    } catch (error) {
      console.error('Failed to initialize Firebase Admin SDK:', error);
      throw new Error('Invalid Firebase service account configuration');
    }
  } else {
    console.warn('Firebase service account key not found. Using default initialization.');
    app = initializeApp();
  }
} else {
  app = getApps()[0];
}

// Initialize Firestore
export const db = getFirestore(app);

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  RECEIPTS: 'receipts',
  SPENDING_CATEGORIES: 'spending_categories',
  INSIGHTS: 'insights',
  WALLET_PASSES: 'wallet_passes'
} as const;

export default app;