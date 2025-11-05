
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

function getSdks(firebaseApp: FirebaseApp) {
    return {
      firebaseApp,
      auth: getAuth(firebaseApp),
      firestore: getFirestore(firebaseApp)
    };
  }

export function initializeFirebase() {
    if (getApps().length) {
        return getSdks(getApp());
    }
    return getSdks(initializeApp(firebaseConfig));
}
