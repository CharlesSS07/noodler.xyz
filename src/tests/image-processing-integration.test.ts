/**
 * Comprehensive Image Processing Integration Test
 * 
 * This test file chains together multiple image processing operations:
 * 1. Fetch URL node - loads an image from the internet
 * 2. Image Loader node - converts the fetched data to JimpInstance
 * 3. HSV node - applies color transformations
 * 4. Other JIMP operations - applies various image modifications
 * 
 * Each component is tested individually first, then integrated together
 * to create a complete image processing pipeline.
 */

import { beforeEach, describe, expect, test } from 'vitest';
import { executeFlowGraph } from '$lib/compositor/Interpreter';
import type { Node, Edge } from '@xyflow/svelte';
import { projectOutputDataCache } from '$lib/stores/ProjectState';

describe('Image Processing Integration Tests', () => {
    let mockNodes: Node[];
    let mockEdges: Edge[];

    beforeEach(async () => {
        mockNodes = [];
        mockEdges = [];
        await projectOutputDataCache.clear();
    });

    // ========================================
    // INDIVIDUAL COMPONENT TESTS
    // ========================================

    describe('Individual Component Tests', () => {
        test('Fetch URL node: fetch actual image from internet', async () => {
            mockNodes = [
                {
                    id: 'fetch-url-test',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'fetch_url',
                        input: { url: 'https://picsum.photos/200/200' },
                    },
                },
            ];
            mockEdges = [];

            await executeFlowGraph('fetch-url-test', mockNodes, mockEdges);
            const result = await projectOutputDataCache.get(
                'fetch-url-test',
                'text'
            );
            
            // The fetch URL node now actually fetches images and returns base64 data
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(100); // Should be substantial base64 data
            // JPEG images typically start with /9j/ in base64
            expect(result.startsWith('/9j/') || result.startsWith('iVBOR')).toBe(true);
        }, 10000); // Extended timeout for network request

        test('Fetch URL node: fetch different image size', async () => {
            // Test with a different image size to verify fetch flexibility
            mockNodes = [
                {
                    id: 'simulate-fetch',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'fetch_url',
                        input: { url: 'https://picsum.photos/100/100' },
                    },
                },
            ];
            mockEdges = [];

            await executeFlowGraph('simulate-fetch', mockNodes, mockEdges);
            const result = await projectOutputDataCache.get('simulate-fetch', 'text');
            
            // Verify fetch functionality with different image
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(50); // Should contain substantial data
            // Should be valid base64 image data
            expect(result.startsWith('/9j/') || result.startsWith('iVBOR')).toBe(true);
        }, 10000); // Extended timeout for network request

        test('Image Loader node: convert base64 to JIMP instance', async () => {
            // Test with a minimal 1x1 red pixel PNG in base64
            const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
            
            mockNodes = [
                {
                    id: 'image-loader-test',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'image_loader',
                        input: { imageOrFileOrString: testImageBase64 },
                    },
                },
            ];
            mockEdges = [];

            await executeFlowGraph('image-loader-test', mockNodes, mockEdges);
            const result = await projectOutputDataCache.get('image-loader-test', 'image');
            
            expect(result).toBeDefined();
            expect(result.bitmap).toBeDefined();
            expect(result.bitmap.width).toBe(1);
            expect(result.bitmap.height).toBe(1);
        });

        test('HSV node: apply color transformations', async () => {
            mockNodes = [
                {
                    id: 'create-image',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'jimp_new_blank_image',
                        input: { width: 50, height: 50, color: '#ff0000' },
                    },
                },
                {
                    id: 'hsv-transform',
                    type: 'node',
                    position: { x: 200, y: 0 },
                    data: {
                        nid: 'hsv',
                        input: { 
                            hue: 180, // Shift hue by 180 degrees (red to cyan)
                            saturation: 25, // Increase saturation
                            value: 10 // Brighten slightly
                        },
                    },
                },
            ];
            mockEdges = [
                {
                    id: 'e1',
                    source: 'create-image',
                    target: 'hsv-transform',
                    sourceHandle: 'image',
                    targetHandle: 'img',
                },
            ];

            await executeFlowGraph('hsv-transform', mockNodes, mockEdges);
            const result = await projectOutputDataCache.get('hsv-transform', 'img');
            
            expect(result).toBeDefined();
            expect(result.bitmap?.width).toBe(50);
            expect(result.bitmap?.height).toBe(50);
        });

        test('Greyscale node: convert to grayscale', async () => {
            mockNodes = [
                {
                    id: 'create-image',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'jimp_new_blank_image',
                        input: { width: 30, height: 30, color: '#00ff00' },
                    },
                },
                {
                    id: 'greyscale',
                    type: 'node',
                    position: { x: 200, y: 0 },
                    data: {
                        nid: 'greyscale',
                        input: {},
                    },
                },
            ];
            mockEdges = [
                {
                    id: 'e1',
                    source: 'create-image',
                    target: 'greyscale',
                    sourceHandle: 'image',
                    targetHandle: 'img',
                },
            ];

            await executeFlowGraph('greyscale', mockNodes, mockEdges);
            const result = await projectOutputDataCache.get('greyscale', 'img');
            
            expect(result).toBeDefined();
            expect(result.bitmap?.width).toBe(30);
            expect(result.bitmap?.height).toBe(30);
        });

        test('Resize node: change image dimensions', async () => {
            mockNodes = [
                {
                    id: 'create-image',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'jimp_new_blank_image',
                        input: { width: 100, height: 100, color: '#0000ff' },
                    },
                },
                {
                    id: 'resize',
                    type: 'node',
                    position: { x: 200, y: 0 },
                    data: {
                        nid: 'jimp_resize_image',
                        input: { width: 75, height: 125 },
                    },
                },
            ];
            mockEdges = [
                {
                    id: 'e1',
                    source: 'create-image',
                    target: 'resize',
                    sourceHandle: 'image',
                    targetHandle: 'image',
                },
            ];

            await executeFlowGraph('resize', mockNodes, mockEdges);
            const result = await projectOutputDataCache.get('resize', 'image');
            
            expect(result).toBeDefined();
            expect(result.bitmap?.width).toBe(75);
            expect(result.bitmap?.height).toBe(125);
        });
    });

    // ========================================
    // INTEGRATION TESTS - CHAINED OPERATIONS
    // ========================================

    describe('Integration Tests - Chained Operations', () => {
        test('Simple chain: Create -> HSV -> Greyscale', async () => {
            mockNodes = [
                {
                    id: 'create-image',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'jimp_new_blank_image',
                        input: { width: 64, height: 64, color: '#ff6600' }, // Orange
                    },
                },
                {
                    id: 'hsv-adjust',
                    type: 'node',
                    position: { x: 200, y: 0 },
                    data: {
                        nid: 'hsv',
                        input: { 
                            hue: 90, // Shift orange towards green
                            saturation: 30, // Boost saturation
                            value: 5 // Slight brightness increase
                        },
                    },
                },
                {
                    id: 'make-greyscale',
                    type: 'node',
                    position: { x: 400, y: 0 },
                    data: {
                        nid: 'greyscale',
                        input: {},
                    },
                },
            ];
            mockEdges = [
                {
                    id: 'e1',
                    source: 'create-image',
                    target: 'hsv-adjust',
                    sourceHandle: 'image',
                    targetHandle: 'img',
                },
                {
                    id: 'e2',
                    source: 'hsv-adjust',
                    target: 'make-greyscale',
                    sourceHandle: 'img',
                    targetHandle: 'img',
                },
            ];

            await executeFlowGraph('make-greyscale', mockNodes, mockEdges);

            // Verify each step
            const originalImage = await projectOutputDataCache.get('create-image', 'image');
            const hsvAdjusted = await projectOutputDataCache.get('hsv-adjust', 'img');
            const finalGreyscale = await projectOutputDataCache.get('make-greyscale', 'img');

            expect(originalImage.bitmap?.width).toBe(64);
            expect(hsvAdjusted.bitmap?.width).toBe(64);
            expect(finalGreyscale.bitmap?.width).toBe(64);
            expect(finalGreyscale.bitmap?.height).toBe(64);
        });

        test('Complex chain: Create -> Resize -> HSV -> Greyscale', async () => {
            mockNodes = [
                {
                    id: 'create-image',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'jimp_new_blank_image',
                        input: { width: 100, height: 100, color: '#ff0080' }, // Pink
                    },
                },
                {
                    id: 'resize-first',
                    type: 'node',
                    position: { x: 150, y: 0 },
                    data: {
                        nid: 'jimp_resize_image',
                        input: { width: 80, height: 120 },
                    },
                },
                {
                    id: 'hsv-colorize',
                    type: 'node',
                    position: { x: 300, y: 0 },
                    data: {
                        nid: 'hsv',
                        input: { 
                            hue: 240, // Shift towards blue
                            saturation: 15, // Reduce saturation slightly
                            value: 8 // Brighten
                        },
                    },
                },
                {
                    id: 'final-greyscale',
                    type: 'node',
                    position: { x: 450, y: 0 },
                    data: {
                        nid: 'greyscale',
                        input: {},
                    },
                },
            ];
            mockEdges = [
                {
                    id: 'e1',
                    source: 'create-image',
                    target: 'resize-first',
                    sourceHandle: 'image',
                    targetHandle: 'image',
                },
                {
                    id: 'e2',
                    source: 'resize-first',
                    target: 'hsv-colorize',
                    sourceHandle: 'image',
                    targetHandle: 'img',
                },
                {
                    id: 'e3',
                    source: 'hsv-colorize',
                    target: 'final-greyscale',
                    sourceHandle: 'img',
                    targetHandle: 'img',
                },
            ];

            await executeFlowGraph('final-greyscale', mockNodes, mockEdges);

            // Verify the complete pipeline
            const original = await projectOutputDataCache.get('create-image', 'image');
            const resized = await projectOutputDataCache.get('resize-first', 'image');
            const colorized = await projectOutputDataCache.get('hsv-colorize', 'img');
            const final = await projectOutputDataCache.get('final-greyscale', 'img');

            // Original dimensions
            expect(original.bitmap?.width).toBe(100);
            expect(original.bitmap?.height).toBe(100);
            
            // After resize
            expect(resized.bitmap?.width).toBe(80);
            expect(resized.bitmap?.height).toBe(120);
            
            // After HSV (dimensions unchanged)
            expect(colorized.bitmap?.width).toBe(80);
            expect(colorized.bitmap?.height).toBe(120);
            
            // Final result (dimensions unchanged)
            expect(final.bitmap?.width).toBe(80);
            expect(final.bitmap?.height).toBe(120);
        });

        test('Full integration: Fetch URL -> Image Loader -> Processing Chain', async () => {
            // Complete integration test: fetch real image from internet -> load -> process
            mockNodes = [
                {
                    id: 'fetch-internet-image',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'fetch_url',
                        input: { url: 'https://picsum.photos/150/150' },
                    },
                },
                {
                    id: 'load-fetched-image',
                    type: 'node',
                    position: { x: 200, y: 0 },
                    data: {
                        nid: 'image_loader',
                        input: {},
                    },
                },
                {
                    id: 'resize-fetched-image',
                    type: 'node',
                    position: { x: 400, y: 0 },
                    data: {
                        nid: 'jimp_resize_image',
                        input: { width: 100, height: 100 },
                    },
                },
                {
                    id: 'hsv-fetched-image',
                    type: 'node',
                    position: { x: 600, y: 0 },
                    data: {
                        nid: 'hsv',
                        input: { 
                            hue: 45, // Yellow shift
                            saturation: 25,
                            value: 10
                        },
                    },
                },
                {
                    id: 'greyscale-fetched-image',
                    type: 'node',
                    position: { x: 800, y: 0 },
                    data: {
                        nid: 'greyscale',
                        input: {},
                    },
                },
            ];
            mockEdges = [
                {
                    id: 'e1',
                    source: 'fetch-internet-image',
                    target: 'load-fetched-image',
                    sourceHandle: 'text',
                    targetHandle: 'imageOrFileOrString',
                },
                {
                    id: 'e2',
                    source: 'load-fetched-image',
                    target: 'resize-fetched-image',
                    sourceHandle: 'image',
                    targetHandle: 'image',
                },
                {
                    id: 'e3',
                    source: 'resize-fetched-image',
                    target: 'hsv-fetched-image',
                    sourceHandle: 'image',
                    targetHandle: 'img',
                },
                {
                    id: 'e4',
                    source: 'hsv-fetched-image',
                    target: 'greyscale-fetched-image',
                    sourceHandle: 'img',
                    targetHandle: 'img',
                },
            ];

            await executeFlowGraph('greyscale-fetched-image', mockNodes, mockEdges);

            // Verify each stage of the pipeline
            const fetchedData = await projectOutputDataCache.get('fetch-internet-image', 'text');
            const loadedImage = await projectOutputDataCache.get('load-fetched-image', 'image');  
            const resizedImage = await projectOutputDataCache.get('resize-fetched-image', 'image');
            const hsvImage = await projectOutputDataCache.get('hsv-fetched-image', 'img');
            const finalImage = await projectOutputDataCache.get('greyscale-fetched-image', 'img');

            // Verify the fetch worked
            expect(fetchedData).toBeDefined();
            expect(typeof fetchedData).toBe('string');
            expect(fetchedData.length).toBeGreaterThan(100);
            
            // Verify image loading worked
            expect(loadedImage).toBeDefined();
            expect(loadedImage.bitmap).toBeDefined();
            expect(loadedImage.bitmap.width).toBe(150); // Original fetched size
            expect(loadedImage.bitmap.height).toBe(150);
            
            // Verify resize worked
            expect(resizedImage).toBeDefined();
            expect(resizedImage.bitmap?.width).toBe(100);
            expect(resizedImage.bitmap?.height).toBe(100);
            
            // Verify HSV transformation
            expect(hsvImage).toBeDefined();
            expect(hsvImage.bitmap?.width).toBe(100);
            expect(hsvImage.bitmap?.height).toBe(100);
            
            // Verify final greyscale conversion
            expect(finalImage).toBeDefined();
            expect(finalImage.bitmap?.width).toBe(100);
            expect(finalImage.bitmap?.height).toBe(100);
        }, 15000); // Extended timeout for network + processing

        test('Alternative integration: Direct Image -> Processing Chain', async () => {
            // Since the fetch_url node currently doesn't fetch actual data,
            // we'll test the image processing pipeline using direct image creation
            // and base64 image loading to simulate what would happen with fetched data
            
            const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
            
            mockNodes = [
                // Simulate what fetch would return by directly providing base64
                {
                    id: 'load-image',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'image_loader',
                        input: { imageOrFileOrString: testImageBase64 },
                    },
                },
                {
                    id: 'resize-loaded',
                    type: 'node',
                    position: { x: 200, y: 0 },
                    data: {
                        nid: 'jimp_resize_image',
                        input: { width: 50, height: 50 },
                    },
                },
                {
                    id: 'hsv-color',
                    type: 'node',
                    position: { x: 400, y: 0 },
                    data: {
                        nid: 'hsv',
                        input: { 
                            hue: 120, // Green shift
                            saturation: 40,
                            value: 15
                        },
                    },
                },
                {
                    id: 'final-gray',
                    type: 'node',
                    position: { x: 600, y: 0 },
                    data: {
                        nid: 'greyscale',
                        input: {},
                    },
                },
            ];
            mockEdges = [
                {
                    id: 'e1',
                    source: 'load-image',
                    target: 'resize-loaded',
                    sourceHandle: 'image',
                    targetHandle: 'image',
                },
                {
                    id: 'e2',
                    source: 'resize-loaded',
                    target: 'hsv-color',
                    sourceHandle: 'image',
                    targetHandle: 'img',
                },
                {
                    id: 'e3',
                    source: 'hsv-color',
                    target: 'final-gray',
                    sourceHandle: 'img',
                    targetHandle: 'img',
                },
            ];

            await executeFlowGraph('final-gray', mockNodes, mockEdges);

            // Verify each stage of the pipeline
            const loadedImage = await projectOutputDataCache.get('load-image', 'image');  
            const resizedImage = await projectOutputDataCache.get('resize-loaded', 'image');
            const hsvImage = await projectOutputDataCache.get('hsv-color', 'img');
            const finalImage = await projectOutputDataCache.get('final-gray', 'img');
            
            // Verify image loading worked
            expect(loadedImage).toBeDefined();
            expect(loadedImage.bitmap).toBeDefined();
            expect(loadedImage.bitmap.width).toBe(1); // Original test image is 1x1
            expect(loadedImage.bitmap.height).toBe(1);
            
            // Verify resize worked
            expect(resizedImage).toBeDefined();
            expect(resizedImage.bitmap?.width).toBe(50);
            expect(resizedImage.bitmap?.height).toBe(50);
            
            // Verify HSV transformation
            expect(hsvImage).toBeDefined();
            expect(hsvImage.bitmap?.width).toBe(50);
            expect(hsvImage.bitmap?.height).toBe(50);
            
            // Verify final greyscale conversion
            expect(finalImage).toBeDefined();
            expect(finalImage.bitmap?.width).toBe(50);
            expect(finalImage.bitmap?.height).toBe(50);
        });
    });

    // ========================================
    // MULTIPLE PROCESSING CHAINS
    // ========================================

    describe('Multiple Processing Chains', () => {
        test('Parallel processing: Same source, different transformations', async () => {
            mockNodes = [
                {
                    id: 'source-image',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'jimp_new_blank_image',
                        input: { width: 60, height: 60, color: '#8A2BE2' }, // Blue violet
                    },
                },
                // Chain 1: HSV -> Greyscale
                {
                    id: 'hsv-chain1',
                    type: 'node',
                    position: { x: 200, y: -50 },
                    data: {
                        nid: 'hsv',
                        input: { hue: 45, saturation: 20, value: 10 },
                    },
                },
                {
                    id: 'grey-chain1',
                    type: 'node',
                    position: { x: 400, y: -50 },
                    data: {
                        nid: 'greyscale',
                        input: {},
                    },
                },
                // Chain 2: Resize -> HSV  
                {
                    id: 'resize-chain2',
                    type: 'node',
                    position: { x: 200, y: 50 },
                    data: {
                        nid: 'jimp_resize_image',
                        input: { width: 40, height: 80 },
                    },
                },
                {
                    id: 'hsv-chain2',
                    type: 'node',
                    position: { x: 400, y: 50 },
                    data: {
                        nid: 'hsv',
                        input: { hue: 180, saturation: 35, value: 0 },
                    },
                },
            ];
            mockEdges = [
                // Chain 1 connections
                {
                    id: 'e1',
                    source: 'source-image',
                    target: 'hsv-chain1',
                    sourceHandle: 'image',
                    targetHandle: 'img',
                },
                {
                    id: 'e2',
                    source: 'hsv-chain1',
                    target: 'grey-chain1',
                    sourceHandle: 'img',
                    targetHandle: 'img',
                },
                // Chain 2 connections
                {
                    id: 'e3',
                    source: 'source-image',
                    target: 'resize-chain2',
                    sourceHandle: 'image',
                    targetHandle: 'image',
                },
                {
                    id: 'e4',
                    source: 'resize-chain2',
                    target: 'hsv-chain2',
                    sourceHandle: 'image',
                    targetHandle: 'img',
                },
            ];

            // Execute both chains
            await executeFlowGraph('grey-chain1', mockNodes, mockEdges);
            await executeFlowGraph('hsv-chain2', mockNodes, mockEdges);

            // Verify source image
            const source = await projectOutputDataCache.get('source-image', 'image');
            expect(source.bitmap?.width).toBe(60);
            expect(source.bitmap?.height).toBe(60);

            // Verify Chain 1 results
            const hsv1 = await projectOutputDataCache.get('hsv-chain1', 'img');
            const grey1 = await projectOutputDataCache.get('grey-chain1', 'img');
            expect(hsv1.bitmap?.width).toBe(60);
            expect(grey1.bitmap?.width).toBe(60);

            // Verify Chain 2 results
            const resize2 = await projectOutputDataCache.get('resize-chain2', 'image');
            const hsv2 = await projectOutputDataCache.get('hsv-chain2', 'img');
            expect(resize2.bitmap?.width).toBe(40);
            expect(resize2.bitmap?.height).toBe(80);
            expect(hsv2.bitmap?.width).toBe(40);
            expect(hsv2.bitmap?.height).toBe(80);
        });
    });

    // ========================================
    // ERROR HANDLING TESTS
    // ========================================

    describe('Error Handling', () => {
        test('Should handle invalid base64 image data gracefully', async () => {
            mockNodes = [
                {
                    id: 'bad-image-data',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'image_loader',
                        input: { imageOrFileOrString: 'invalid-base64-data' },
                    },
                },
            ];
            mockEdges = [];

            // The system handles errors gracefully and returns error information
            const result = await executeFlowGraph('bad-image-data', mockNodes, mockEdges);
            
            // Should return an error result rather than throwing
            expect(result).toBeDefined();
            expect(result.success).toBe(false);
            expect(result.errors).toBeDefined();
            expect(result.errors.length).toBeGreaterThan(0);
        });

        test('Should handle missing image input to HSV node', async () => {
            mockNodes = [
                {
                    id: 'hsv-no-input',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'hsv',
                        input: { hue: 45, saturation: 20, value: 10 },
                        // Missing img input
                    },
                },
            ];
            mockEdges = [];

            // The system handles missing inputs gracefully
            const result = await executeFlowGraph('hsv-no-input', mockNodes, mockEdges);
            
            // Should return an error result for missing required input
            expect(result).toBeDefined();
            expect(result.success).toBe(false);
            expect(result.errors).toBeDefined();
            expect(result.errors.length).toBeGreaterThan(0);
        });

        test('Should handle invalid HSV values gracefully', async () => {
            mockNodes = [
                {
                    id: 'create-image',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'jimp_new_blank_image',
                        input: { width: 25, height: 25, color: '#ff0000' },
                    },
                },
                {
                    id: 'invalid-hsv',
                    type: 'node',
                    position: { x: 200, y: 0 },
                    data: {
                        nid: 'hsv',
                        input: { 
                            hue: 999, // Invalid hue value (should be 0-360)
                            saturation: -50, // Invalid negative saturation
                            value: 200 // Invalid value (should be 0-100)
                        },
                    },
                },
            ];
            mockEdges = [
                {
                    id: 'e1',
                    source: 'create-image',
                    target: 'invalid-hsv',
                    sourceHandle: 'image',
                    targetHandle: 'img',
                },
            ];

            // The HSV node with invalid values should fail gracefully
            const result = await executeFlowGraph('invalid-hsv', mockNodes, mockEdges);
            
            // Should return an error result due to invalid HSV values
            expect(result).toBeDefined();
            expect(result.success).toBe(false);
            expect(result.errors).toBeDefined();
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });

    // ========================================
    // PERFORMANCE TESTS
    // ========================================

    describe('Performance Tests', () => {
        test('Large image processing chain: performance benchmark', async () => {
            mockNodes = [
                {
                    id: 'large-image',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'jimp_new_blank_image',
                        input: { width: 200, height: 200, color: '#FF4500' }, // Large orange image
                    },
                },
                {
                    id: 'resize-large',
                    type: 'node',
                    position: { x: 150, y: 0 },
                    data: {
                        nid: 'jimp_resize_image',
                        input: { width: 150, height: 150 },
                    },
                },
                {
                    id: 'hsv-large',
                    type: 'node',
                    position: { x: 300, y: 0 },
                    data: {
                        nid: 'hsv',
                        input: { hue: 90, saturation: 25, value: 15 },
                    },
                },
                {
                    id: 'grey-large',
                    type: 'node',
                    position: { x: 450, y: 0 },
                    data: {
                        nid: 'greyscale',
                        input: {},
                    },
                },
            ];
            mockEdges = [
                {
                    id: 'e1',
                    source: 'large-image',
                    target: 'resize-large',
                    sourceHandle: 'image',
                    targetHandle: 'image',
                },
                {
                    id: 'e2',
                    source: 'resize-large',
                    target: 'hsv-large',
                    sourceHandle: 'image',
                    targetHandle: 'img',
                },
                {
                    id: 'e3',
                    source: 'hsv-large',
                    target: 'grey-large',
                    sourceHandle: 'img',
                    targetHandle: 'img',
                },
            ];

            const startTime = Date.now();
            await executeFlowGraph('grey-large', mockNodes, mockEdges);
            const endTime = Date.now();

            const result = await projectOutputDataCache.get('grey-large', 'img');
            
            expect(result).toBeDefined();
            expect(result.bitmap?.width).toBe(150);
            expect(result.bitmap?.height).toBe(150);
            
            // Processing should complete in reasonable time (under 5 seconds)
            expect(endTime - startTime).toBeLessThan(5000);
        });
    });
});