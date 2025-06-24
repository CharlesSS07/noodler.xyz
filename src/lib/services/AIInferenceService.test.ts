/**
 * Unit tests for AIInferenceService
 * Tests AI inference service methods including GenKit summarization
 * 
 * These tests call the real AI inference APIs through Firebase Functions
 */

import { beforeEach, describe, expect, test } from 'vitest';
import { executeFlowGraph } from '$lib/compositor/Interpreter';
import type { Node, Edge } from '@xyflow/svelte';
import { projectOutputDataCache } from '$lib/stores/ProjectState';
import { auth } from '../../firebase';
import { signInAnonymously } from 'firebase/auth';
import { AIInferenceService } from './AIInferenceService';

// Test timeout - AI operations can take time
const TEST_TIMEOUT = 60000;

describe('AIInferenceService Tests', () => {
    let aiService: AIInferenceService;
    let nodes: Node[];
    let edges: Edge[];

    beforeEach(async () => {
        nodes = [];
        edges = [];
        await projectOutputDataCache.clear();
        
        // Sign in anonymously for Firebase auth
        const userCredential = await signInAnonymously(auth);
        aiService = new AIInferenceService({ user: userCredential.user });
    });

    // ========================================
    // GenKit Summarization Tests
    // ========================================

    describe('genkitSummarization', () => {
        test('should summarize text with default parameters', async () => {
            const testContent = `
                The importance of artificial intelligence in modern technology cannot be overstated. 
                AI has revolutionized industries ranging from healthcare to finance, enabling 
                unprecedented automation and decision-making capabilities. Machine learning algorithms 
                can now process vast amounts of data to identify patterns and make predictions with 
                remarkable accuracy. Deep learning, a subset of machine learning, has been particularly 
                transformative, powering advances in natural language processing, computer vision, 
                and speech recognition. As we continue to develop more sophisticated AI systems, 
                we must also consider the ethical implications and ensure that these technologies 
                are developed and deployed responsibly.
            `;

            const result = await aiService.summarize({
                content: testContent
            });

            expect(result).toBeDefined();
            expect(result.summary).toBeDefined();
            expect(typeof result.summary).toBe('string');
            expect(result.summary.length).toBeGreaterThan(0);
            expect(result.originalLength).toBe(testContent.length);
            expect(result.summaryLength).toBe(result.summary.length);
            expect(result.compressionRatio).toBeGreaterThan(0);
            expect(result.compressionRatio).toBeLessThanOrEqual(1);

            console.log('Summarization result:', {
                originalLength: result.originalLength,
                summaryLength: result.summaryLength,
                compressionRatio: result.compressionRatio,
                summary: result.summary
            });
        }, TEST_TIMEOUT);

        test('should summarize with custom maxLength', async () => {
            // Use longer content to ensure compression is possible
            const testContent = 'This is a much longer test document that needs to be summarized. It contains multiple sentences and paragraphs with detailed information about various topics. The document discusses artificial intelligence, machine learning, deep learning, natural language processing, computer vision, and many other complex technological concepts that require significant explanation and context.';

            const result = await aiService.summarize({
                content: testContent,
                maxLength: 50
            });

            expect(result).toBeDefined();
            expect(result.summary).toBeDefined();
            expect(typeof result.summary).toBe('string');
            expect(result.summary.length).toBeGreaterThan(0);
            expect(result.originalLength).toBe(testContent.length);
            expect(result.summaryLength).toBe(result.summary.length);
            expect(result.compressionRatio).toBeGreaterThan(0);
            // For longer content, we should see some compression
            expect(result.compressionRatio).toBeLessThan(1);
        }, TEST_TIMEOUT);

        test('should summarize with different styles', async () => {
            const testContent = 'Climate change is one of the most pressing issues of our time. It affects weather patterns, sea levels, and biodiversity worldwide.';

            // Test brief style
            const briefResult = await aiService.summarize({
                content: testContent,
                style: 'brief'
            });

            // Test detailed style
            const detailedResult = await aiService.summarize({
                content: testContent,
                style: 'detailed'
            });

            // Test bullet-points style
            const bulletResult = await aiService.summarize({
                content: testContent,
                style: 'bullet-points'
            });

            expect(briefResult.summary).toBeDefined();
            expect(detailedResult.summary).toBeDefined();
            expect(bulletResult.summary).toBeDefined();

            console.log('Style comparison:', {
                brief: briefResult.summary,
                detailed: detailedResult.summary,
                bulletPoints: bulletResult.summary
            });
        }, TEST_TIMEOUT);

        test('should handle empty content gracefully', async () => {
            await expect(aiService.summarize({
                content: ''
            })).rejects.toThrow();
        }, TEST_TIMEOUT);

        test('should handle very short content', async () => {
            const result = await aiService.summarize({
                content: 'Short text.'
            });

            expect(result).toBeDefined();
            expect(result.summary).toBeDefined();
            expect(result.originalLength).toBe(11); // 'Short text.' length
        }, TEST_TIMEOUT);

        test('should handle large content', async () => {
            // Generate a longer text
            const longContent = Array(100).fill('This is a sentence about artificial intelligence and machine learning. ').join('');

            const result = await aiService.summarize({
                content: longContent,
                maxLength: 200
            });

            expect(result).toBeDefined();
            expect(result.summary).toBeDefined();
            expect(result.originalLength).toBe(longContent.length);
            expect(result.compressionRatio).toBeLessThan(0.5); // Should be significantly compressed
        }, TEST_TIMEOUT);

        test('should handle network errors gracefully', async () => {
            // Create service with invalid base URL to simulate network error
            const invalidService = new AIInferenceService({ 
                user: auth.currentUser!,
                functionUrl: 'http://invalid-url-that-should-fail.com'
            });

            await expect(invalidService.summarize({
                content: 'Test content'
            })).rejects.toThrow();
        }, TEST_TIMEOUT);
    });

    // ========================================
    // GenKitSummarizationNode Integration Tests
    // ========================================

    describe('GenKitSummarizationNode Integration', () => {
        test('should execute summarization node with default parameters', async () => {
            const testContent = 'Artificial intelligence is transforming how we work and live. Machine learning algorithms can process data and make decisions faster than ever before.';

            nodes = [
                {
                    id: 'genkit-summarization-test',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'genkit_summarization',
                        input: {
                            content: testContent,
                            maxLength: 150,
                            style: 'brief'
                        },
                    },
                },
            ];

            await executeFlowGraph('genkit-summarization-test', nodes, edges);

            // Check outputs
            const summary = await projectOutputDataCache.get('genkit-summarization-test', 'summary');
            const originalLength = await projectOutputDataCache.get('genkit-summarization-test', 'originalLength');
            const summaryLength = await projectOutputDataCache.get('genkit-summarization-test', 'summaryLength');
            const compressionRatio = await projectOutputDataCache.get('genkit-summarization-test', 'compressionRatio');

            expect(summary).toBeDefined();
            expect(typeof summary).toBe('string');
            expect(summary.length).toBeGreaterThan(0);
            expect(originalLength).toBe(testContent.length);
            expect(summaryLength).toBe(summary.length);
            expect(compressionRatio).toBeGreaterThan(0);
            // expect(compressionRatio).toBeLessThanOrEqual(1); // the summary might be longer than the input, especially for small inputs

            console.log('Node execution result:', {
                summary,
                originalLength,
                summaryLength,
                compressionRatio
            });
        }, TEST_TIMEOUT);

        test('should execute summarization node with custom parameters', async () => {
            const testContent = 'The evolution of technology has accelerated rapidly in the past decade. From smartphones to artificial intelligence, innovations continue to reshape our daily lives and work environments.';

            nodes = [
                {
                    id: 'genkit-summarization-custom-test',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'genkit_summarization',
                        input: {
                            content: testContent,
                            maxLength: 75,
                            style: 'detailed'
                        },
                    },
                },
            ];

            await executeFlowGraph('genkit-summarization-custom-test', nodes, edges);

            const summary = await projectOutputDataCache.get('genkit-summarization-custom-test', 'summary');
            const compressionRatio = await projectOutputDataCache.get('genkit-summarization-custom-test', 'compressionRatio');

            expect(summary).toBeDefined();
            expect(typeof summary).toBe('string');
            expect(compressionRatio).toBeGreaterThan(0);

            console.log('Custom parameters result:', { summary, compressionRatio });
        }, TEST_TIMEOUT);

        test('should handle bullet-points style', async () => {
            const testContent = 'Key benefits of renewable energy include reduced carbon emissions, energy independence, job creation, and long-term cost savings. Solar and wind power are becoming increasingly affordable and efficient.';

            nodes = [
                {
                    id: 'genkit-summarization-bullets-test',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'genkit_summarization',
                        input: {
                            content: testContent,
                            maxLength: 150,
                            style: 'bullet-points'
                        },
                    },
                },
            ];

            await executeFlowGraph('genkit-summarization-bullets-test', nodes, edges);
            

            const summary = await projectOutputDataCache.get('genkit-summarization-bullets-test', 'summary');
            expect(summary).toBeDefined();
            expect(typeof summary).toBe('string');

            console.log('Bullet points summary:', summary);
        }, TEST_TIMEOUT);

        test('should fail gracefully with invalid content', async () => {
            nodes = [
                {
                    id: 'genkit-summarization-invalid-test',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'genkit_summarization',
                        input: {
                            content: null, // Invalid content
                            maxLength: 150,
                            style: 'brief'
                        },
                    },
                },
            ];

            const result = await executeFlowGraph('genkit-summarization-invalid-test', nodes, edges);
            
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.error).toContain('Content input is required');
        }, TEST_TIMEOUT);

        test('should fail gracefully with empty content', async () => {
            nodes = [
                {
                    id: 'genkit-summarization-empty-test',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'genkit_summarization',
                        input: {
                            content: '',
                            maxLength: 150,
                            style: 'brief'
                        },
                    },
                },
            ];

            const result = await executeFlowGraph('genkit-summarization-empty-test', nodes, edges);
            
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        }, TEST_TIMEOUT);

        test('should handle authentication errors', async () => {
            // Sign out to test auth error
            await auth.signOut();

            nodes = [
                {
                    id: 'genkit-summarization-unauth-test',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'genkit_summarization',
                        input: {
                            content: 'Test content',
                            maxLength: 150,
                            style: 'brief'
                        },
                    },
                },
            ];

            const result = await executeFlowGraph('genkit-summarization-unauth-test', nodes, edges);
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('User must be authenticated');

            // Sign back in for other tests
            await signInAnonymously(auth);
        }, TEST_TIMEOUT);
    });
});