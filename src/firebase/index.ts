import { initializeApp } from 'firebase/app';
import {
    connectAuthEmulator,
    getAuth,
    setPersistence,
    browserLocalPersistence,
} from 'firebase/auth';
import { connectDatabaseEmulator, getDatabase } from 'firebase/database';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
import { browser } from '$app/environment';

const firebaseConfig = {
    apiKey: 'AIzaSyAs0yTwlWsB5XrmDx5PXV10gNfotvKIG5o',
    authDomain: 'chuck-65c6e.firebaseapp.com',
    projectId: 'chuck-65c6e',
    storageBucket: 'chuck-65c6e.firebasestorage.app',
    messagingSenderId: '848785764143',
    appId: '1:848785764143:web:a90527ad07a4ca038e3bda',
    measurementId: 'G-HT9WHT43FY',
};

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const rtdb = getDatabase(app);
export const firestore = getFirestore(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);

// Connect to emulators if in test environment or browser localhost
let isUsingEmulators = false;
if (
    process.env.NODE_ENV === 'test' ||
    (browser && window.location.hostname === 'localhost')
) {
    console.log('[DEBUG] Connecting to Firebase emulators');
    connectAuthEmulator(auth, 'http://127.0.0.1:9099');
    connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
    connectDatabaseEmulator(rtdb, '127.0.0.1', 9000);
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    connectStorageEmulator(storage, '127.0.0.1', 9199);
    isUsingEmulators = true;
    console.log('[DEBUG] Connected to emulators');
}

// Export emulator status for use in other services
export { isUsingEmulators };

if (browser) {
    setPersistence(auth, browserLocalPersistence).catch((error) =>
        console.error('Error setting persistence:', error)
    );
}
