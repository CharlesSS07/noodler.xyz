// Script to populate test nodes in Firestore emulator for testing NodeSearch
import { initializeApp } from 'firebase/app';
import { connectFirestoreEmulator, getFirestore, collection, addDoc } from 'firebase/firestore';

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
const firestore = getFirestore(app);

// Connect to emulator since we're running localhost
connectFirestoreEmulator(firestore, '127.0.0.1', 8080);

const testNodes = [
    {
        title: 'Text Input',
        documentation: 'Create or edit raw text content',
        author_uid: 'test-user',
        trust_level: 'Official',
        input_socket_order: [],
        output_socket_order: ['text'],
        category: 'Text Processing'
    },
    {
        title: 'Image Loader',
        documentation: 'Load and display images from files',
        author_uid: 'test-user', 
        trust_level: 'Official',
        input_socket_order: ['file'],
        output_socket_order: ['image'],
        category: 'Image Processing'
    },
    {
        title: 'Text Template',
        documentation: 'Fill in text templates with variables',
        author_uid: 'test-user',
        trust_level: 'Official', 
        input_socket_order: ['template', 'variables'],
        output_socket_order: ['text'],
        category: 'Text Processing'
    },
    {
        title: 'LLM Chat',
        documentation: 'Chat with large language models using Huggingface',
        author_uid: 'test-user',
        trust_level: 'Trusted',
        input_socket_order: ['prompt', 'model', 'temperature'],
        output_socket_order: ['response'],
        category: 'AI/ML'
    },
    {
        title: 'Image Grayscale',
        documentation: 'Convert color images to grayscale',
        author_uid: 'test-user',
        trust_level: 'Official',
        input_socket_order: ['image'],
        output_socket_order: ['image'],
        category: 'Image Processing'
    },
    {
        title: 'JSON Parser',
        documentation: 'Parse and manipulate JSON data',
        author_uid: 'community-user',
        trust_level: 'New',
        input_socket_order: ['json_text'],
        output_socket_order: ['object'],
        category: 'Data Processing'
    },
    {
        title: 'HTML Renderer',
        documentation: 'Render HTML content in an iframe',
        author_uid: 'test-user',
        trust_level: 'Official',
        input_socket_order: ['html'],
        output_socket_order: [],
        category: 'Web/HTML'
    },
    {
        title: 'File Uploader',
        documentation: 'Upload and read file contents',
        author_uid: 'test-user',
        trust_level: 'Trusted',
        input_socket_order: [],
        output_socket_order: ['file_content', 'filename'],
        category: 'File Operations'
    }
];

async function populateNodes() {
    console.log('Populating test nodes in Firestore emulator...');
    
    try {
        const nodesCollection = collection(firestore, 'nodes');
        
        for (const node of testNodes) {
            const docRef = await addDoc(nodesCollection, node);
            console.log(`Added node: ${node.title} with ID: ${docRef.id}`);
        }
        
        console.log('Successfully populated all test nodes!');
    } catch (error) {
        console.error('Error populating nodes:', error);
    }
}

populateNodes();