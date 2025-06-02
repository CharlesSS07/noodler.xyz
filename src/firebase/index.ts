import { initializeApp } from 'firebase/app';
import {
	connectAuthEmulator,
	getAuth,
	setPersistence,
	browserLocalPersistence
} from 'firebase/auth';
import { connectDatabaseEmulator, getDatabase } from 'firebase/database';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { browser } from '$app/environment';

const firebaseConfig = {
	apiKey: 'AIzaSyAs0yTwlWsB5XrmDx5PXV10gNfotvKIG5o',
	authDomain: 'chuck-65c6e.firebaseapp.com',
	projectId: 'chuck-65c6e',
	storageBucket: 'chuck-65c6e.firebasestorage.app',
	messagingSenderId: '848785764143',
	appId: '1:848785764143:web:a90527ad07a4ca038e3bda',
	measurementId: 'G-HT9WHT43FY'
};

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const rtdb = getDatabase(app);
export const firestore = getFirestore(app);

if (browser) {
	const hostname = window.location.hostname;

	if (hostname === 'localhost') {
		connectAuthEmulator(auth, 'http://127.0.0.1:9099');
		connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
		connectDatabaseEmulator(rtdb, '127.0.0.1', 9000);
		// connectStorageEmulator(storage, "localhost", 9199);
		// connectFunctionsEmulator(functions, "localhost", 5001);
	}

	setPersistence(auth, browserLocalPersistence).catch((error) =>
		console.error('Error setting persistence:', error)
	);
}
