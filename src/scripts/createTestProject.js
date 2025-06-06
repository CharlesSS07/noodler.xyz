// Script to create a test project in Firebase RTDB emulator
import { initializeApp } from 'firebase/app';
import { connectDatabaseEmulator, getDatabase, ref, set, push } from 'firebase/database';

const firebaseConfig = {
    apiKey: 'AIzaSyAs0yTwlWsB5XrmDx5PXV10gNfotvKIG5o',
    authDomain: 'chuck-65c6e.firebaseapp.com',
    projectId: 'chuck-65c6e',
    storageBucket: 'chuck-65c6e.firebasestorage.app',
    messagingSenderId: '848785764143',
    appId: '1:848785764143:web:a90527ad07a4ca038e3bda',
    measurementId: 'G-HT9WHT43FY',
};

const app = initializeApp(firebaseConfig);
const rtdb = getDatabase(app);

// Connect to emulator since we're running localhost
connectDatabaseEmulator(rtdb, '127.0.0.1', 9000);

const testProject = {
    title: 'Test Collaboration Project',
    description: 'A test project for real-time collaboration',
    nodes: [
        {
            id: 'node-1',
            type: 'textEditor',
            position: { x: 100, y: 100 },
            data: { title: 'Test Node 1', content: 'Hello World' }
        },
        {
            id: 'node-2', 
            type: 'textEditor',
            position: { x: 300, y: 200 },
            data: { title: 'Test Node 2', content: 'Another node' }
        }
    ],
    edges: [],
    created_at: new Date().toISOString(),
    last_updated_at: new Date().toISOString(),
    invited_users: { 'test-user': true }
};

async function createTestProject() {
    console.log('Creating test project in Firebase RTDB emulator...');
    
    try {
        const fridgeRef = ref(rtdb, 'fridge');
        const newProjectRef = push(fridgeRef);
        await set(newProjectRef, testProject);
        
        console.log(`Test project created with ID: ${newProjectRef.key}`);
        console.log(`Access URL: http://localhost:5173/app?pid=${newProjectRef.key}`);
        
        return newProjectRef.key;
    } catch (error) {
        console.error('Error creating test project:', error);
    }
}

createTestProject();