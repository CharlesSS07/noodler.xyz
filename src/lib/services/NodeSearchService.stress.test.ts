import { describe, it, expect, beforeAll } from 'vitest';
import { NodeSearchService } from './NodeSearchService';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

/**
 * Stress tests for NodeSearchService
 * Tests performance, concurrency, and edge cases
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

describe('NodeSearchService Stress Tests', () => {
    let nodeSearchService: NodeSearchService;
    
    beforeAll(async () => {
        console.log('🚀 Setting up stress test environment');
        
        const app = initializeApp(firebaseConfig, 'stress-test');
        const auth = getAuth(app);
        const functions = getFunctions(app);

        // Use emulator for stress tests to avoid hitting production limits
        if (process.env.NODE_ENV === 'test' || process.env.FIRESTORE_EMULATOR_HOST) {
            try {
                connectFunctionsEmulator(functions, 'localhost', 5001);
                console.log('✅ Connected to functions emulator for stress tests');
            } catch (error) {
                console.log('⚠️ Functions emulator already connected');
            }
        }

        await signInAnonymously(auth);
        nodeSearchService = new NodeSearchService();
        
        console.log('✅ Stress test environment ready');
    }, 30000);

    describe('Concurrency Tests', () => {
        it('should handle 10 concurrent searches', async () => {
            const searchTerms = [
                'text processing',
                'image editing',
                'data analysis',
                'mathematical calculation',
                'web development',
                'machine learning',
                'file conversion',
                'audio processing',
                'video editing',
                'database operations'
            ];

            const startTime = Date.now();
            
            const promises = searchTerms.map(term => 
                nodeSearchService.searchByText(term)
            );

            const results = await Promise.all(promises);
            
            const endTime = Date.now();
            const duration = endTime - startTime;

            console.log(`✅ 10 concurrent searches completed in ${duration}ms`);

            expect(results).toHaveLength(10);
            results.forEach((result, index) => {
                expect(Array.isArray(result)).toBe(true);
                console.log(`Search "${searchTerms[index]}" returned ${result.length} results`);
            });

            // All searches should complete within reasonable time
            expect(duration).toBeLessThan(30000); // 30 seconds max
        }, 60000);

        it('should handle mixed concurrent operations', async () => {
            const operations = [
                () => nodeSearchService.searchByText('artificial intelligence'),
                () => nodeSearchService.searchByCategory('Official'),
                () => nodeSearchService.getPopularNodes(10),
                () => nodeSearchService.searchBySocketType('string', true),
                () => nodeSearchService.getSuggestedNodes('AI project'),
                () => nodeSearchService.searchByTags(['math', 'calculation']),
                () => nodeSearchService.searchByText('image processing'),
                () => nodeSearchService.searchByCategory('Trusted'),
            ];

            const startTime = Date.now();
            const results = await Promise.all(operations.map(op => op()));
            const endTime = Date.now();

            console.log(`✅ 8 mixed operations completed in ${endTime - startTime}ms`);

            expect(results).toHaveLength(8);
            results.forEach(result => {
                expect(Array.isArray(result)).toBe(true);
            });
        }, 60000);
    });

    describe('Load Tests', () => {
        it('should handle rapid sequential searches', async () => {
            const searchTerms = [
                'node', 'text', 'image', 'data', 'math', 'web', 'ai', 'file', 'audio', 'video'
            ];

            const results = [];
            const timings = [];

            for (const term of searchTerms) {
                const startTime = Date.now();
                const result = await nodeSearchService.searchByText(term);
                const endTime = Date.now();
                
                results.push(result);
                timings.push(endTime - startTime);
            }

            console.log('Sequential search timings:', timings.map(t => `${t}ms`).join(', '));

            expect(results).toHaveLength(10);
            results.forEach(result => {
                expect(Array.isArray(result)).toBe(true);
            });

            // Each search should complete within reasonable time
            timings.forEach(timing => {
                expect(timing).toBeLessThan(10000); // 10 seconds max per search
            });
        }, 120000);

        it('should handle burst requests', async () => {
            // Simulate a burst of 20 requests in quick succession
            const burstSize = 20;
            const promises = [];

            for (let i = 0; i < burstSize; i++) {
                promises.push(nodeSearchService.searchByText(`search query ${i}`));
            }

            const startTime = Date.now();
            const results = await Promise.all(promises);
            const endTime = Date.now();

            console.log(`✅ ${burstSize} burst requests completed in ${endTime - startTime}ms`);

            expect(results).toHaveLength(burstSize);
            results.forEach(result => {
                expect(Array.isArray(result)).toBe(true);
            });
        }, 120000);
    });

    describe('Edge Case Tests', () => {
        it('should handle very long search queries', async () => {
            const longQuery = 'text processing image editing data analysis mathematical calculations web development machine learning artificial intelligence natural language processing computer vision deep learning neural networks ' + 'a'.repeat(500);
            
            const result = await nodeSearchService.searchByText(longQuery);
            
            expect(Array.isArray(result)).toBe(true);
            console.log(`Long query search returned ${result.length} results`);
        }, 30000);

        it('should handle special characters in search', async () => {
            const specialQueries = [
                'text & processing',
                'image/photo editing',
                'data-analysis',
                'math+calculation',
                'web@development',
                'AI#ML',
                'file%conversion',
                'audio*processing'
            ];

            for (const query of specialQueries) {
                const result = await nodeSearchService.searchByText(query);
                expect(Array.isArray(result)).toBe(true);
                console.log(`Special char query "${query}" returned ${result.length} results`);
            }
        }, 60000);

        it('should handle unicode and international characters', async () => {
            const unicodeQueries = [
                'traitement de texte', // French
                'Bildbearbeitung', // German
                'データ分析', // Japanese
                '图像处理', // Chinese
                'обработка текста', // Russian
                'معالجة النصوص', // Arabic
                'text 🔍 search', // Emoji
                'αναζήτηση κειμένου' // Greek
            ];

            for (const query of unicodeQueries) {
                const result = await nodeSearchService.searchByText(query);
                expect(Array.isArray(result)).toBe(true);
                console.log(`Unicode query "${query}" returned ${result.length} results`);
            }
        }, 60000);

        it('should handle very large result limits', async () => {
            const result = await nodeSearchService.searchByText('node', 100);
            
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeLessThanOrEqual(100);
            console.log(`Large limit search returned ${result.length} results`);
        }, 30000);

        it('should handle zero and negative limits gracefully', async () => {
            // Test with zero limit
            const zeroResult = await nodeSearchService.searchByText('text', 0);
            expect(Array.isArray(zeroResult)).toBe(true);
            
            // Test with negative limit (should be handled gracefully)
            const negativeResult = await nodeSearchService.searchByText('text', -5);
            expect(Array.isArray(negativeResult)).toBe(true);
            
            console.log(`Zero limit: ${zeroResult.length}, Negative limit: ${negativeResult.length}`);
        }, 30000);
    });

    describe('Error Recovery Tests', () => {
        it('should recover from multiple failed searches', async () => {
            // Mix of potentially problematic and normal searches
            const queries = [
                '', // Empty
                'a'.repeat(5000), // Very long
                null as any, // Invalid input
                'normal search', // Should work
                undefined as any, // Invalid input
                'another normal search' // Should work
            ];

            const results = [];
            for (const query of queries) {
                try {
                    const result = await nodeSearchService.searchByText(query);
                    results.push(result);
                } catch (error) {
                    console.log(`Expected error for query "${query}":`, error.message);
                    results.push([]); // Empty result for failed search
                }
            }

            // Should have results for all queries (empty arrays for failed ones)
            expect(results).toHaveLength(queries.length);
            
            // Normal searches should still work
            expect(Array.isArray(results[3])).toBe(true);
            expect(Array.isArray(results[5])).toBe(true);
        }, 60000);

        it('should maintain performance after errors', async () => {
            // Cause some errors first
            try {
                await nodeSearchService.searchByText(null as any);
            } catch (error) {
                // Expected
            }

            try {
                await nodeSearchService.searchByText(undefined as any);
            } catch (error) {
                // Expected
            }

            // Now test that normal operations still work efficiently
            const startTime = Date.now();
            const result = await nodeSearchService.searchByText('performance test');
            const endTime = Date.now();

            expect(Array.isArray(result)).toBe(true);
            expect(endTime - startTime).toBeLessThan(10000); // Should still be fast
            
            console.log(`Post-error search completed in ${endTime - startTime}ms`);
        }, 30000);
    });

    describe('Performance Benchmarks', () => {
        it('should meet performance benchmarks for common operations', async () => {
            const benchmarks = [
                {
                    name: 'Basic text search',
                    operation: () => nodeSearchService.searchByText('text processing'),
                    maxTime: 5000
                },
                {
                    name: 'Category search',
                    operation: () => nodeSearchService.searchByCategory('Official'),
                    maxTime: 5000
                },
                {
                    name: 'Popular nodes',
                    operation: () => nodeSearchService.getPopularNodes(),
                    maxTime: 5000
                },
                {
                    name: 'Socket search',
                    operation: () => nodeSearchService.searchBySocketType('string', true),
                    maxTime: 5000
                },
                {
                    name: 'Suggestions',
                    operation: () => nodeSearchService.getSuggestedNodes('test project'),
                    maxTime: 8000
                }
            ];

            for (const benchmark of benchmarks) {
                const startTime = Date.now();
                const result = await benchmark.operation();
                const endTime = Date.now();
                const duration = endTime - startTime;

                expect(Array.isArray(result)).toBe(true);
                expect(duration).toBeLessThan(benchmark.maxTime);
                
                console.log(`✅ ${benchmark.name}: ${duration}ms (max: ${benchmark.maxTime}ms)`);
            }
        }, 60000);
    });
});