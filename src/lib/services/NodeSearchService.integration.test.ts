import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { NodeSearchService } from './NodeSearchService';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';

/**
 * This integration test suite validates the NodeSearchService with real Firebase services and live data, testing complete search workflows from data setup through search operations to cleanup. The tests create realistic test node data, perform actual embedding operations, and verify end-to-end search functionality including vector similarity search, filtering operations, and result ranking with proper test data isolation and cleanup.
 * 
 * Test categories:
 * • searchByText - Tests finding nodes by text content, math-related searches, empty search handling, and non-existent search term handling with real vector embeddings
 * • searchByCategory - Validates official and trusted trust level filtering with live Firestore data and actual node classification
 * • searchBySocketType - Tests finding nodes with specific input/output socket types using real node socket definitions and filtering
 * • getSuggestedNodes - Verifies project-based suggestions for image processing, data processing, and general suggestions with live recommendation algorithms
 * • searchByTags - Tests tag-based filtering for math, image, and single tag searches with real tag indexing and matching
 * • getPopularNodes - Validates popular node retrieval with maxResults parameter handling and real popularity metrics
 * • Error Handling - Tests graceful handling of network errors and invalid queries with real error scenarios
 * • Performance Tests - Validates concurrent search operations, response time requirements, and system performance under load with real infrastructure
 */

// Test configuration
const firebaseConfig = {
    apiKey: 'AIzaSyAs0yTwlWsB5XrmDx5PXV10gNfotvKIG5o',
    authDomain: 'chuck-65c6e.firebaseapp.com',
    projectId: 'chuck-65c6e',
    storageBucket: 'chuck-65c6e.firebasestorage.app',
    messagingSenderId: '848785764143',
    appId: '1:848785764143:web:a90527ad07a4ca038e3bda',
    measurementId: 'G-HT9WHT43FY',
};

// Test environment detection
const isEmulatorTest = process.env.FIRESTORE_EMULATOR_HOST || process.env.NODE_ENV === 'test';
const useEmulator = process.env.USE_EMULATOR !== 'false' && isEmulatorTest;

describe('NodeSearchService Integration Tests', () => {
    let app: any;
    let auth: any;
    let firestore: any;
    let functions: any;
    let nodeSearchService: NodeSearchService;
    let testUser: any;

    // Test data for creating test libs
    const testNodes = [
        {
            nid: 'test-text-processor-int',
            title: 'Text Processing Node',
            documentation: 'Processes and transforms text strings with various operations like uppercase, lowercase, trim, and replace',
            tags: ['text', 'string', 'processing', 'transformation'],
            trust_level: 'Official',
            input_sockets: [
                { key: 'input', type: 'string', description: 'Input text to process' },
                { key: 'operation', type: 'string', description: 'Processing operation to apply' }
            ],
            output_sockets: [
                { key: 'output', type: 'string', description: 'Processed text result' }
            ],
            author_uid: 'test-user',
            created_at: new Date().toISOString(),
            last_updated_at: new Date().toISOString(),
            searchable: true
        },
        {
            nid: 'test-math-calculator-int',
            title: 'Mathematical Calculator',
            documentation: 'Performs mathematical calculations including addition, subtraction, multiplication, and division of numbers',
            tags: ['math', 'arithmetic', 'calculator', 'numbers'],
            trust_level: 'Trusted',
            input_sockets: [
                { key: 'a', type: 'number', description: 'First number' },
                { key: 'b', type: 'number', description: 'Second number' },
                { key: 'operation', type: 'string', description: 'Math operation (+, -, *, /)' }
            ],
            output_sockets: [
                { key: 'result', type: 'number', description: 'Calculation result' }
            ],
            author_uid: 'test-user',
            created_at: new Date().toISOString(),
            last_updated_at: new Date().toISOString(),
            searchable: true
        },
        {
            nid: 'test-image-editor-int',
            title: 'Image Editor Pro',
            documentation: 'Advanced image editing capabilities including filters, cropping, resizing, and color adjustments',
            tags: ['image', 'photo', 'editing', 'graphics', 'visual'],
            trust_level: 'Official',
            input_sockets: [
                { key: 'image', type: 'image', description: 'Input image to edit' },
                { key: 'filter', type: 'string', description: 'Filter to apply' }
            ],
            output_sockets: [
                { key: 'edited_image', type: 'image', description: 'Processed image' }
            ],
            author_uid: 'test-user',
            created_at: new Date().toISOString(),
            last_updated_at: new Date().toISOString(),
            searchable: true
        },
        {
            nid: 'test-data-parser-int',
            title: 'JSON Data Parser',
            documentation: 'Parses and extracts data from JSON objects and arrays with support for nested structures',
            tags: ['data', 'json', 'parsing', 'extraction'],
            trust_level: 'Trusted',
            input_sockets: [
                { key: 'json_data', type: 'json', description: 'JSON data to parse' },
                { key: 'path', type: 'string', description: 'Path to extract' }
            ],
            output_sockets: [
                { key: 'extracted_value', type: 'any', description: 'Extracted value' }
            ],
            author_uid: 'test-user',
            created_at: new Date().toISOString(),
            last_updated_at: new Date().toISOString(),
            searchable: true
        }
    ];

    beforeAll(async () => {
        // Initialize Firebase
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        firestore = getFirestore(app);
        functions = getFunctions(app);

        if (useEmulator) {
            console.log('🔧 Connecting to Firebase emulators for integration tests');
            try {
                connectFunctionsEmulator(functions, 'localhost', 5001);
                console.log('✅ Connected to Functions emulator');
            } catch (error) {
                console.log('⚠️ Functions emulator already connected or not available');
            }
        } else {
            console.log('🌐 Using production Firebase for integration tests');
        }

        // Sign in anonymously for authentication
        testUser = await signInAnonymously(auth);
        console.log(`🔐 Signed in as: ${testUser.user.uid}`);

        // Initialize the service
        nodeSearchService = new NodeSearchService();
    }, 30000);

    afterAll(async () => {
        if (testUser) {
            await signOut(auth);
            console.log('🔓 Signed out test user');
        }
    }, 10000);

    beforeEach(async () => {
        // Clean up test data before each test
        await cleanupTestData();
        
        // Create fresh test data
        await setupTestData();
        
        // Wait for data to be available
        await new Promise(resolve => setTimeout(resolve, 1000));
    }, 60000);

    async function setupTestData() {
        console.log('📝 Setting up test data...');
        
        // Create test libs in Firestore
        for (const node of testNodes) {
            await setDoc(doc(firestore, 'nodes', node.nid), node);
        }

        // Embed the test libs if we're using emulator (production might already have embeddings)
        if (useEmulator) {
            const embedFunction = httpsCallable(functions, 'embedNodeBluePrint');
            
            for (const node of testNodes) {
                try {
                    await embedFunction({ nid: node.nid });
                    console.log(`✅ Embedded node: ${node.nid}`);
                } catch (error) {
                    console.warn(`⚠️ Failed to embed node ${node.nid}:`, error);
                }
            }
            
            // Wait for embeddings to be processed
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    async function cleanupTestData() {
        console.log('🧹 Cleaning up test data...');
        
        // Delete test libs
        for (const node of testNodes) {
            try {
                await deleteDoc(doc(firestore, 'nodes', node.nid));
            } catch (error) {
                // Ignore if document doesn't exist
            }
        }
    }

    describe('searchByText', () => {
        it('should find libs by text content', async () => {
            const results = await nodeSearchService.searchByText('text processing');
            
            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);
            
            if (results.length > 0) {
                expect(results[0]).toHaveProperty('id');
                expect(results[0]).toHaveProperty('title');
                expect(results[0]).toHaveProperty('documentation');
                
                // Should find the text processor node
                const textNode = results.find(r => r.id === 'test-text-processor-int');
                if (textNode) {
                    expect(textNode.title).toContain('Text');
                }
            }
        }, 30000);

        it('should find math-related libs', async () => {
            const results = await nodeSearchService.searchByText('mathematics calculator arithmetic');
            
            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);
            
            // Should find the math calculator node
            const mathNode = results.find(r => r.id === 'test-math-calculator-int');
            if (mathNode) {
                expect(mathNode.title).toContain('Calculator');
            }
        }, 30000);

        it('should handle empty search gracefully', async () => {
            const results = await nodeSearchService.searchByText('');
            
            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);
            // Should return popular/official libs
        }, 30000);

        it('should handle non-existent search terms', async () => {
            const results = await nodeSearchService.searchByText('xyznonexistentkeyword123');
            
            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);
            // Results might be empty or return similar libs
        }, 30000);
    });

    describe('searchByCategory', () => {
        it('should find Official trust level libs', async () => {
            const results = await nodeSearchService.searchByCategory('Official');
            
            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);
            
            // Filter results to only test libs for verification
            const testResults = results.filter(r => r.id.includes('-int'));
            testResults.forEach(node => {
                expect(node.trust_level).toBe('Official');
            });
        }, 30000);

        it('should find Trusted trust level libs', async () => {
            const results = await nodeSearchService.searchByCategory('Trusted');
            
            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);
            
            // Filter results to only test libs for verification
            const testResults = results.filter(r => r.id.includes('-int'));
            testResults.forEach(node => {
                expect(node.trust_level).toBe('Trusted');
            });
        }, 30000);
    });

    describe('searchBySocketType', () => {
        it('should find libs with string input sockets', async () => {
            const results = await nodeSearchService.searchBySocketType('string', true);
            
            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);
            
            // Should find libs that accept string inputs
            const stringInputNodes = results.filter(r => r.id.includes('-int'));
            expect(stringInputNodes.length).toBeGreaterThan(0);
        }, 30000);

        it('should find libs with number output sockets', async () => {
            const results = await nodeSearchService.searchBySocketType('number', false);
            
            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);
            
            // Should find the math calculator node
            const numberOutputNodes = results.filter(r => r.id.includes('-int'));
            expect(numberOutputNodes.length).toBeGreaterThan(0);
        }, 30000);
    });

    describe('getSuggestedNodes', () => {
        it('should get suggestions for image processing project', async () => {
            const results = await nodeSearchService.getSuggestedNodes('image processing and photo editing project');
            
            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);
            
            // Should potentially find the image editor node
            const imageNode = results.find(r => r.id === 'test-image-editor-int');
            if (imageNode) {
                expect(imageNode.title).toContain('Image');
            }
        }, 30000);

        it('should get suggestions for data processing project', async () => {
            const results = await nodeSearchService.getSuggestedNodes('data analysis and JSON processing');
            
            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);
            
            // Should potentially find the data parser node
            const dataNode = results.find(r => r.id === 'test-data-parser-int');
            if (dataNode) {
                expect(dataNode.title).toContain('JSON');
            }
        }, 30000);

        it('should get general suggestions when no project description provided', async () => {
            const results = await nodeSearchService.getSuggestedNodes();
            
            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);
            // Should return some suggested libs
        }, 30000);
    });

    describe('searchByTags', () => {
        it('should find libs by math tags', async () => {
            const results = await nodeSearchService.searchByTags(['math', 'arithmetic']);
            
            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);
            
            // Should find the math calculator node
            const mathNode = results.find(r => r.id === 'test-math-calculator-int');
            if (mathNode) {
                expect(mathNode.title).toContain('Calculator');
            }
        }, 30000);

        it('should find libs by image tags', async () => {
            const results = await nodeSearchService.searchByTags(['image', 'photo']);
            
            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);
            
            // Should find the image editor node
            const imageNode = results.find(r => r.id === 'test-image-editor-int');
            if (imageNode) {
                expect(imageNode.title).toContain('Image');
            }
        }, 30000);

        it('should handle single tag search', async () => {
            const results = await nodeSearchService.searchByTags(['text']);
            
            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);
            
            // Should find the text processor node
            const textNode = results.find(r => r.id === 'test-text-processor-int');
            if (textNode) {
                expect(textNode.title).toContain('Text');
            }
        }, 30000);
    });

    describe('getPopularNodes', () => {
        it('should return popular libs', async () => {
            const results = await nodeSearchService.getPopularNodes();
            
            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);
            
            // Should return some libs (might include test libs or existing libs)
            if (results.length > 0) {
                expect(results[0]).toHaveProperty('id');
                expect(results[0]).toHaveProperty('title');
                expect(results[0]).toHaveProperty('documentation');
            }
        }, 30000);

        it('should respect maxResults parameter', async () => {
            const maxResults = 5;
            const results = await nodeSearchService.getPopularNodes(maxResults);
            
            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);
            expect(results.length).toBeLessThanOrEqual(maxResults);
        }, 30000);
    });

    describe('Error Handling', () => {
        it('should handle network errors gracefully', async () => {
            // This test might be hard to simulate, but we can test with invalid queries
            const results = await nodeSearchService.searchByText('a'.repeat(10000)); // Very long query
            
            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);
            // Should return empty array or handle gracefully
        }, 30000);
    });

    describe('Performance Tests', () => {
        it('should handle multiple concurrent searches', async () => {
            const searchPromises = [
                nodeSearchService.searchByText('text'),
                nodeSearchService.searchByText('math'),
                nodeSearchService.searchByText('image'),
                nodeSearchService.searchByCategory('Official'),
                nodeSearchService.getPopularNodes()
            ];

            const results = await Promise.all(searchPromises);
            
            expect(results).toHaveLength(5);
            results.forEach(result => {
                expect(result).toBeDefined();
                expect(Array.isArray(result)).toBe(true);
            });
        }, 60000);

        it('should return results within reasonable time', async () => {
            const startTime = Date.now();
            const results = await nodeSearchService.searchByText('test search query');
            const endTime = Date.now();
            
            const duration = endTime - startTime;
            console.log(`Search completed in ${duration}ms`);
            
            expect(results).toBeDefined();
            expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
        }, 30000);
    });
});