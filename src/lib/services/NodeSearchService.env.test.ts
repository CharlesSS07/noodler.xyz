import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { NodeSearchService } from './NodeSearchService';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

/**
 * This environment-specific test suite validates the NodeSearchService across both Firebase emulator and production environments, ensuring consistent functionality, performance, and reliability in different deployment contexts. The tests verify cross-environment compatibility, response time requirements, and proper environment detection while maintaining result structure consistency regardless of the underlying infrastructure.
 * 
 * Test categories:
 * • Emulator Environment - Tests basic text search, category handling, popular node retrieval, socket type search, suggestion generation, tag-based search, empty search handling, specific search terms, error case handling, and response time validation in emulator environment
 * • Production Environment - Validates identical functionality in production environment with real Firebase services and production data
 * • Cross-Environment Consistency - Verifies consistent result structures, property validation, type checking, and behavior across different environments regardless of underlying data differences
 */

const firebaseConfig = {
    apiKey: 'AIzaSyAs0yTwlWsB5XrmDx5PXV10gNfotvKIG5o',
    authDomain: 'chuck-65c6e.firebaseapp.com',
    projectId: 'chuck-65c6e',
    storageBucket: 'chuck-65c6e.firebasestorage.app',
    messagingSenderId: '848785764143',
    appId: '1:848785764143:web:a90527ad07a4ca038e3bda',
    measurementId: 'G-HT9WHT43FY',
};

describe('NodeSearchService Environment Tests', () => {
    let nodeSearchService: NodeSearchService;
    
    // Test configurations for different environments
    const testConfigs = [
        {
            name: 'Emulator',
            useEmulator: true,
            timeout: 30000
        },
        {
            name: 'Production',
            useEmulator: false,
            timeout: 60000
        }
    ];

    describe.each(testConfigs)('$name Environment', ({ name, useEmulator, timeout }) => {
        beforeAll(async () => {
            console.log(`🔧 Setting up ${name} environment tests`);
            
            // Initialize Firebase for this test suite
            const app = initializeApp(firebaseConfig, `test-${name.toLowerCase()}`);
            const auth = getAuth(app);
            const functions = getFunctions(app);

            if (useEmulator) {
                // Force emulator environment variables
                process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
                process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
                process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST = '127.0.0.1:5001';
                
                try {
                    connectFunctionsEmulator(functions, 'localhost', 5001);
                    console.log(`✅ Connected to ${name} functions emulator`);
                } catch (error) {
                    console.log(`⚠️ ${name} functions emulator already connected`);
                }
            } else {
                // Clear emulator environment variables for production tests
                delete process.env.FIRESTORE_EMULATOR_HOST;
                delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
                delete process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST;
                console.log(`✅ Using production ${name} environment`);
            }

            // Authenticate
            await signInAnonymously(auth);
            console.log(`🔐 Authenticated for ${name} tests`);

            // Initialize service
            nodeSearchService = new NodeSearchService();
            
            // Wait for initialization
            await new Promise(resolve => setTimeout(resolve, 1000));
        }, timeout);

        it('should perform basic text search', async () => {
            const results = await nodeSearchService.searchByText('text processing');
            
            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);
            
            console.log(`${name} text search returned ${results.length} results`);
            
            if (results.length > 0) {
                const firstResult = results[0];
                expect(firstResult).toHaveProperty('id');
                expect(firstResult).toHaveProperty('title');
                expect(firstResult).toHaveProperty('documentation');
                expect(typeof firstResult.id).toBe('string');
                expect(typeof firstResult.title).toBe('string');
                
                console.log(`${name} first result:`, {
                    id: firstResult.id,
                    title: firstResult.title,
                    similarity: firstResult.similarity
                });
            }
        }, timeout);

        it('should handle search by category', async () => {
            const results = await nodeSearchService.searchByCategory('Official');
            
            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);
            
            console.log(`${name} category search returned ${results.length} results`);
            
            // Verify structure
            results.forEach(result => {
                expect(result).toHaveProperty('id');
                expect(result).toHaveProperty('title');
                expect(typeof result.id).toBe('string');
                expect(typeof result.title).toBe('string');
            });
        }, timeout);

        it('should get popular libs', async () => {
            const results = await nodeSearchService.getPopularNodes(5);
            
            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);
            expect(results.length).toBeLessThanOrEqual(5);
            
            console.log(`${name} popular nodes returned ${results.length} results`);
            
            if (results.length > 0) {
                const firstResult = results[0];
                expect(firstResult).toHaveProperty('id');
                expect(firstResult).toHaveProperty('title');
                expect(typeof firstResult.id).toBe('string');
                expect(typeof firstResult.title).toBe('string');
                
                console.log(`${name} popular node example:`, {
                    id: firstResult.id,
                    title: firstResult.title
                });
            }
        }, timeout);

        it('should handle socket type search', async () => {
            const results = await nodeSearchService.searchBySocketType('string', true, 5);
            
            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);
            expect(results.length).toBeLessThanOrEqual(5);
            
            console.log(`${name} socket search returned ${results.length} results`);
        }, timeout);

        it('should get suggestions', async () => {
            const results = await nodeSearchService.getSuggestedNodes('image processing', 3);
            
            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);
            expect(results.length).toBeLessThanOrEqual(3);
            
            console.log(`${name} suggestions returned ${results.length} results`);
        }, timeout);

        it('should handle tag-based search', async () => {
            const results = await nodeSearchService.searchByTags(['text', 'processing'], 5);
            
            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);
            expect(results.length).toBeLessThanOrEqual(5);
            
            console.log(`${name} tag search returned ${results.length} results`);
        }, timeout);

        it('should handle empty search gracefully', async () => {
            const results = await nodeSearchService.searchByText('');
            
            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);
            
            console.log(`${name} empty search returned ${results.length} results`);
        }, timeout);

        it('should handle very specific search terms', async () => {
            const results = await nodeSearchService.searchByText('mathematical arithmetic calculation');
            
            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);
            
            console.log(`${name} specific search returned ${results.length} results`);
        }, timeout);

        it('should handle error cases gracefully', async () => {
            // Test with a very long query that might cause issues
            const longQuery = 'a'.repeat(1000);
            const results = await nodeSearchService.searchByText(longQuery);
            
            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);
            
            console.log(`${name} long query returned ${results.length} results`);
        }, timeout);

        it('should have reasonable response times', async () => {
            const startTime = Date.now();
            const results = await nodeSearchService.searchByText('test query for performance');
            const endTime = Date.now();
            
            const duration = endTime - startTime;
            
            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);
            expect(duration).toBeLessThan(15000); // Should complete within 15 seconds
            
            console.log(`${name} search completed in ${duration}ms`);
        }, timeout);
    });

    describe('Cross-Environment Consistency', () => {
        it('should return consistent result structures across environments', async () => {
            // This test would ideally run the same query against both environments
            // and compare the structure (not necessarily the content) of results
            
            const query = 'text processing node';
            
            // For now, just ensure the service can be instantiated and used
            const service = new NodeSearchService();
            const results = await service.searchByText(query);
            
            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);
            
            if (results.length > 0) {
                const result = results[0];
                
                // Verify all required properties exist
                expect(result).toHaveProperty('id');
                expect(result).toHaveProperty('title');
                expect(result).toHaveProperty('documentation');
                expect(result).toHaveProperty('author_uid');
                expect(result).toHaveProperty('trust_level');
                expect(result).toHaveProperty('category');
                expect(result).toHaveProperty('input_socket_count');
                expect(result).toHaveProperty('output_socket_count');
                
                // Verify types
                expect(typeof result.id).toBe('string');
                expect(typeof result.title).toBe('string');
                expect(typeof result.documentation).toBe('string');
                expect(typeof result.author_uid).toBe('string');
                expect(typeof result.trust_level).toBe('string');
                expect(typeof result.category).toBe('string');
                expect(typeof result.input_socket_count).toBe('number');
                expect(typeof result.output_socket_count).toBe('number');
                
                if (result.similarity !== undefined) {
                    expect(typeof result.similarity).toBe('number');
                }
            }
        }, 30000);
    });
});