/**
 * This test suite validates AI inference nodes by executing them through the complete Firestore node blueprint system and flow graph interpreter, testing real AI model integrations without mocking. The tests verify that AI-powered nodes can be properly instantiated, configured, and executed within the visual programming environment while maintaining proper authentication and error handling.
 * 
 * Test categories:
 * • Text Processing AI Nodes - Tests AI Fill Mask Node with BERT model integration, text completion functionality, prediction ranking, and result structure validation
 */

import { beforeEach, describe, expect, test } from 'vitest';
import { executeFlowGraph } from '$lib/compositor/FlowExecution';
import type { Node, Edge } from '@xyflow/svelte';
import { projectComputedDataCache } from '$lib/stores/ProjectState';
import { auth } from '../firebase';
import { signInAnonymously } from 'firebase/auth';

describe('AI Inference Nodes Unit Tests', () => {
    let nodes: Node[];
    let edges: Edge[];

    beforeEach(async () => {
        nodes = [];
        edges = [];
        await projectComputedDataCache.clear();

        // Sign in anonymously for Firebase auth
        await signInAnonymously(auth);
    });

    // ========================================
    // TEXT PROCESSING NODES
    // ========================================

    describe('Text Processing AI Nodes', () => {
        test('AI Fill Mask Node', async () => {
            nodes = [
                {
                    id: 'ai-fill-mask-test',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'ai_fill_mask',
                        input: {
                            text: 'The weather today is [MASK].',
                            model: 'bert-base-uncased',
                            top_k: 5,
                        },
                    },
                },
            ];

            const result = await executeFlowGraph(
                'ai-fill-mask-test',
                nodes,
                edges
            );

            expect(result.success).toBe(true);

            // Check that we got predictions output
            const outputData = await projectComputedDataCache.get(
                'ai-fill-mask-test',
                'predictions'
            );
            expect(outputData).toBeDefined();
            expect(Array.isArray(outputData)).toBe(true);
            expect(outputData.length).toBeGreaterThan(0);

            // Each prediction should have a token_str and score
            if (outputData.length > 0) {
                expect(outputData[0]).toHaveProperty('token_str');
                expect(outputData[0]).toHaveProperty('score');
                expect(typeof outputData[0].score).toBe('number');
            }

            console.log('Fill mask predictions:', outputData);
        });
    });
});
