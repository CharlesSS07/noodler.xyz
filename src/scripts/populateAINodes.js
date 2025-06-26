// Script to populate AI inference nodes in Firestore emulator for testing
import { initializeApp } from 'firebase/app';
import {
    connectFirestoreEmulator,
    getFirestore,
    doc,
    setDoc,
} from 'firebase/firestore';

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

const aiNodes = [
    {
        nid: 'ai_text_generation',
        title: 'AI Text Generation',
        documentation: 'Generate text using AI models via HuggingFace API',
        user_defined_code: '',
        input_sockets: {
            prompt: { type: 'text', required: true },
            model: { type: 'text', required: false },
            max_length: { type: 'number', required: false },
            temperature: { type: 'number', required: false },
            do_sample: { type: 'boolean', required: false },
            top_k: { type: 'number', required: false },
            top_p: { type: 'number', required: false },
        },
        input_socket_order: [
            'prompt',
            'model',
            'max_length',
            'temperature',
            'do_sample',
            'top_k',
            'top_p',
        ],
        output_sockets: {
            generated_text: { type: 'text' },
        },
        output_socket_order: ['generated_text'],
        author_uid: 'official',
        trust_level: 'Official',
        category: 'AI/ML',
        created_at: new Date(),
        last_updated_at: new Date(),
        is_frozen: false,
        predecessor_nid: 'root',
        official_note: '',
    },
    {
        nid: 'ai_text_classification',
        title: 'AI Text Classification',
        documentation: 'Classify text using AI models via HuggingFace API',
        user_defined_code: '',
        input_sockets: {
            text: { type: 'text', required: true },
            model: { type: 'text', required: false },
        },
        input_socket_order: ['text', 'model'],
        output_sockets: {
            results: { type: 'object' },
        },
        output_socket_order: ['results'],
        author_uid: 'official',
        trust_level: 'Official',
        category: 'AI/ML',
        created_at: new Date(),
        last_updated_at: new Date(),
        is_frozen: false,
        predecessor_nid: 'root',
        official_note: '',
    },
    {
        nid: 'ai_question_answering',
        title: 'AI Question Answering',
        documentation: 'Answer questions based on context using AI models',
        user_defined_code: '',
        input_sockets: {
            question: { type: 'text', required: true },
            context: { type: 'text', required: true },
            model: { type: 'text', required: false },
        },
        input_socket_order: ['question', 'context', 'model'],
        output_sockets: {
            answer: { type: 'text' },
            score: { type: 'number' },
        },
        output_socket_order: ['answer', 'score'],
        author_uid: 'official',
        trust_level: 'Official',
        category: 'AI/ML',
        created_at: new Date(),
        last_updated_at: new Date(),
        is_frozen: false,
        predecessor_nid: 'root',
        official_note: '',
    },
    {
        nid: 'ai_summarization',
        title: 'AI Summarization',
        documentation: 'Summarize text using AI models via HuggingFace API',
        user_defined_code: '',
        input_sockets: {
            text: { type: 'text', required: true },
            model: { type: 'text', required: false },
            max_length: { type: 'number', required: false },
            min_length: { type: 'number', required: false },
        },
        input_socket_order: ['text', 'model', 'max_length', 'min_length'],
        output_sockets: {
            summary: { type: 'text' },
        },
        output_socket_order: ['summary'],
        author_uid: 'official',
        trust_level: 'Official',
        category: 'AI/ML',
        created_at: new Date(),
        last_updated_at: new Date(),
        is_frozen: false,
        predecessor_nid: 'root',
        official_note: '',
    },
    {
        nid: 'ai_translation',
        title: 'AI Translation',
        documentation: 'Translate text using AI models via HuggingFace API',
        user_defined_code: '',
        input_sockets: {
            text: { type: 'text', required: true },
            model: { type: 'text', required: false },
        },
        input_socket_order: ['text', 'model'],
        output_sockets: {
            translated_text: { type: 'text' },
        },
        output_socket_order: ['translated_text'],
        author_uid: 'official',
        trust_level: 'Official',
        category: 'AI/ML',
        created_at: new Date(),
        last_updated_at: new Date(),
        is_frozen: false,
        predecessor_nid: 'root',
        official_note: '',
    },
];

async function populateAINodes() {
    console.log('Populating AI inference nodes in Firestore emulator...');

    try {
        for (const node of aiNodes) {
            const docRef = doc(firestore, 'nodes', node.nid);
            await setDoc(docRef, node);
            console.log(`Added AI node: ${node.title} with NID: ${node.nid}`);
        }

        console.log('Successfully populated all AI inference nodes!');
    } catch (error) {
        console.error('Error populating AI nodes:', error);
    }
}

populateAINodes();
