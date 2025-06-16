/**
 * Unit tests for AI Inference Nodes
 * Tests all AI inference nodes by calling them through the Firestore node blueprint system
 * 
 * These tests use the real AI inference service but mock the HTTP requests
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';
import { executeFlowGraph } from '../routes/app/lib/Interpreter';
import type { Node, Edge } from '@xyflow/svelte';
import { projectOutputDataCache } from '$lib/stores/ProjectState';
import { auth } from '../firebase';
import { signInAnonymously } from 'firebase/auth';
import { Jimp } from 'jimp';

describe('AI Inference Nodes Unit Tests', () => {
    let nodes: Node[];
    let mockEdges: Edge[];

    beforeEach(async () => {
        nodes = [];
        mockEdges = [];
        await projectOutputDataCache.clear();
        
        // Sign in anonymously for Firebase auth
        await signInAnonymously(auth);
        
        // Reset fetch mock
        vi.clearAllMocks();
    });

    // ========================================
    // TEXT PROCESSING NODES
    // ========================================

    describe('Text Processing AI Nodes', () => {
        test('AI Text Generation Node', async () => {

            nodes = [
                {
                    id: 'ai-text-gen-test',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'node_official_ai_text_generation', // all nodes have prefix node_official_
                        input: {
                            prompt: 'Can you please let us know more details about your',
                            model: 'google/gemma-2-2b-it',
                            max_length: 50,
                            temperature: 0.7,
                            do_sample: true,
                            top_k: 50,
                            top_p: 0.9
                        },
                    },
                },
            ];

            const result = await executeFlowGraph('ai-text-gen-test', nodes, mockEdges);
            
            expect(result.success).toBe(true);
            
            // Verify the fetch was called with correct parameters
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/textGeneration'),
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer mock-id-token',
                        'Content-Type': 'application/json'
                    }),
                    body: JSON.stringify({
                        inputs: 'Can you please let us know more details about your',
                        model: 'google/gemma-2-2b-it',
                        parameters: {
                            max_length: 50,
                            temperature: 0.7,
                            do_sample: true,
                            top_k: 50,
                            top_p: 0.9
                        }
                    })
                })
            );

            const outputData = await projectOutputDataCache.get('ai-text-gen-test', 'generated_text');
            expect(outputData).toBeDefined();
            console.log(outputData);
        });

        test('AI Text Classification Node', async () => {
            // Mock the fetch response
            const mockResponse = [
                [
                    { label: 'POSITIVE', score: 0.9998 },
                    { label: 'NEGATIVE', score: 0.0002 }
                ]
            ];
            
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            nodes = [
                {
                    id: 'ai-text-class-test',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'ai_text_classification',
                        input: {
                            text: 'I love this product! It works amazingly well.',
                            model: 'cardiffnlp/twitter-roberta-base-sentiment-latest'
                        },
                    },
                },
            ];

            const result = await executeFlowGraph('ai-text-class-test', nodes, mockEdges);
            
            expect(result.success).toBe(true);
            
            // Verify the fetch was called with correct parameters
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/textClassification'),
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer mock-id-token',
                        'Content-Type': 'application/json'
                    }),
                    body: JSON.stringify({
                        inputs: 'I love this product! It works amazingly well.',
                        model: 'cardiffnlp/twitter-roberta-base-sentiment-latest'
                    })
                })
            );

            const outputData = await projectOutputDataCache.get('ai-text-class-test', 'results');
            expect(outputData).toEqual([
                { label: 'POSITIVE', score: 0.9998 },
                { label: 'NEGATIVE', score: 0.0002 }
            ]);
        });

        test('AI Question Answering Node', async () => {
            // Mock the fetch response
            const mockResponse = {
                answer: 'Paris',
                score: 0.9985,
                start: 109,
                end: 114
            };
            
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            nodes = [
                {
                    id: 'ai-qa-test',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'ai_question_answering',
                        input: {
                            question: 'What is the capital of France?',
                            context: 'France is a country in Europe. Paris is the capital and largest city of France.',
                            model: 'distilbert-base-cased-distilled-squad'
                        },
                    },
                },
            ];

            const result = await executeFlowGraph('ai-qa-test', nodes, mockEdges);
            
            expect(result.success).toBe(true);
            
            // Verify the fetch was called with correct parameters
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/questionAnswering'),
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer mock-id-token',
                        'Content-Type': 'application/json'
                    }),
                    body: JSON.stringify({
                        inputs: {
                            question: 'What is the capital of France?',
                            context: 'France is a country in Europe. Paris is the capital and largest city of France.'
                        },
                        model: 'distilbert-base-cased-distilled-squad'
                    })
                })
            );

            const answerData = await projectOutputDataCache.get('ai-qa-test', 'answer');
            const scoreData = await projectOutputDataCache.get('ai-qa-test', 'score');
            expect(answerData).toBe('Paris');
            expect(scoreData).toBe(0.9985);
        });

        test('AI Summarization Node', async () => {
            // Mock the fetch response
            const mockResponse = [
                { summary_text: 'Artificial Intelligence is transforming technology across industries.' }
            ];
            
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            nodes = [
                {
                    id: 'ai-summary-test',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'ai_summarization',
                        input: {
                            text: 'Artificial Intelligence (AI) has emerged as one of the most transformative technologies of the 21st century. From healthcare to finance, education to entertainment, AI is revolutionizing how we work, live, and interact with the world around us.',
                            model: 'facebook/bart-large-cnn',
                            max_length: 50,
                            min_length: 10
                        },
                    },
                },
            ];

            const result = await executeFlowGraph('ai-summary-test', nodes, mockEdges);
            
            expect(result.success).toBe(true);
            
            // Verify the fetch was called with correct parameters
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/summarization'),
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer mock-id-token',
                        'Content-Type': 'application/json'
                    }),
                    body: JSON.stringify({
                        inputs: 'Artificial Intelligence (AI) has emerged as one of the most transformative technologies of the 21st century. From healthcare to finance, education to entertainment, AI is revolutionizing how we work, live, and interact with the world around us.',
                        model: 'facebook/bart-large-cnn',
                        parameters: {
                            max_length: 50,
                            min_length: 10,
                            do_sample: false
                        }
                    })
                })
            );

            const outputData = await projectOutputDataCache.get('ai-summary-test', 'summary');
            expect(outputData).toBe('Artificial Intelligence is transforming technology across industries.');
        });

        test('AI Translation Node', async () => {
            // Mock the fetch response
            const mockResponse = [
                { translation_text: 'Bonjour, comment allez-vous?' }
            ];
            
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            nodes = [
                {
                    id: 'ai-translation-test',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'ai_translation',
                        input: {
                            text: 'Hello, how are you?',
                            model: 'Helsinki-NLP/opus-mt-en-fr'
                        },
                    },
                },
            ];

            const result = await executeFlowGraph('ai-translation-test', nodes, mockEdges);
            
            expect(result.success).toBe(true);
            
            // Verify the fetch was called with correct parameters
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/translation'),
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer mock-id-token',
                        'Content-Type': 'application/json'
                    }),
                    body: JSON.stringify({
                        inputs: 'Hello, how are you?',
                        model: 'Helsinki-NLP/opus-mt-en-fr'
                    })
                })
            );

            const outputData = await projectOutputDataCache.get('ai-translation-test', 'translated_text');
            expect(outputData).toBe('Bonjour, comment allez-vous?');
        });
    });

    // ========================================
    // ERROR HANDLING TESTS
    // ========================================

    describe('AI Node Error Handling', () => {
        test('Should handle API errors gracefully', async () => {
            // Mock an API error response
            (global.fetch as any).mockResolvedValueOnce({
                ok: false,
                status: 429,
                json: async () => ({ error: 'API rate limit exceeded' })
            });

            nodes = [
                {
                    id: 'failing-node',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'ai_text_generation',
                        input: {
                            prompt: 'Test prompt',
                            model: 'gpt2'
                        },
                    },
                },
            ];

            const result = await executeFlowGraph('failing-node', nodes, mockEdges);
            
            expect(result.success).toBe(false);
            expect(result.errors).toBeDefined();
        });

        test('Should handle network errors', async () => {
            // Mock a network error
            (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

            nodes = [
                {
                    id: 'network-error-node',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'ai_text_generation',
                        input: {
                            prompt: 'Test prompt',
                            model: 'gpt2'
                        },
                    },
                },
            ];

            const result = await executeFlowGraph('network-error-node', nodes, mockEdges);
            
            expect(result.success).toBe(false);
            expect(result.errors).toBeDefined();
        });
    });
});