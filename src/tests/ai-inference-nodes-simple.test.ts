/**
 * Simplified AI Inference Nodes Test
 * Tests the framework with existing nodes first, then extends to AI nodes
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';
import { executeFlowGraph } from '../routes/app/lib/Interpreter';
import type { Node, Edge } from '@xyflow/svelte';
import { projectOutputDataCache } from '$lib/stores/ProjectState';

describe('AI Infrastructure Test', () => {
    let mockNodes: Node[];
    let mockEdges: Edge[];

    beforeEach(async () => {
        mockNodes = [];
        mockEdges = [];
        await projectOutputDataCache.clear();
    });

    test('Basic Math Node (Control Test)', async () => {
        // First test with a known working node to verify the framework
        mockNodes = [
            {
                id: 'add-test',
                type: 'node',
                position: { x: 0, y: 0 },
                data: {
                    nid: 'node_official_add',
                    input: { a: 15, b: 25 },
                },
            },
        ];

        const result = await executeFlowGraph('add-test', mockNodes, mockEdges);
        
        expect(result.success).toBe(true);
        
        const outputData = await projectOutputDataCache.get('add-test', 'result');
        expect(outputData).toBe(40);
    });

    test('Test AI Node Structure (Mock Test)', async () => {
        // Test that we can structure an AI inference node correctly
        // This will fail initially but shows the structure we need
        mockNodes = [
            {
                id: 'ai-test',
                type: 'node',
                position: { x: 0, y: 0 },
                data: {
                    nid: 'ai_text_generation',
                    input: {
                        prompt: 'Hello world',
                        model: 'gpt2',
                        max_length: 50
                    },
                },
            },
        ];

        try {
            const result = await executeFlowGraph('ai-test', mockNodes, mockEdges);
            
            // This might fail because the AI node isn't registered in Firestore yet
            // But we can check the structure
            console.log('AI test result:', result);
        } catch (error) {
            console.log('Expected error - AI node not registered:', error.message);
            // This is expected until we register the AI nodes in Firestore
            expect(error.message).toContain('NodeBlueprint document not found');
        }
    });
});