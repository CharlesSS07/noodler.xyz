/**
 * Unit tests for AIInferenceService
 * Tests AI inference service methods including GenKit summarization
 *
 * These tests call the real AI inference APIs through Firebase Functions
 */

import { beforeEach, describe, expect, test } from 'vitest';
import { executeFlowGraph } from '$lib/compositor/Interpreter';
import type { Node, Edge } from '@xyflow/svelte';
import { projectComputedDataCache } from '$lib/stores/ProjectState';
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
        await projectComputedDataCache.clear();

        // Sign in anonymously for Firebase auth
        const userCredential = await signInAnonymously(auth);
        aiService = new AIInferenceService({ user: userCredential.user });
    });

    // ========================================
    // GenKit Summarization Tests
    // ========================================

    describe('genkitSummarization', () => {
        test(
            'should summarize text with default parameters',
            async () => {
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
                    content: testContent,
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
                    summary: result.summary,
                });
            },
            TEST_TIMEOUT
        );

        test(
            'should summarize with custom maxLength',
            async () => {
                // Use longer content to ensure compression is possible
                const testContent =
                    'This is a much longer test document that needs to be summarized. It contains multiple sentences and paragraphs with detailed information about various topics. The document discusses artificial intelligence, machine learning, deep learning, natural language processing, computer vision, and many other complex technological concepts that require significant explanation and context.';

                const result = await aiService.summarize({
                    content: testContent,
                    maxLength: 50,
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
            },
            TEST_TIMEOUT
        );

        test(
            'should summarize with different styles',
            async () => {
                const testContent =
                    'Climate change is one of the most pressing issues of our time. It affects weather patterns, sea levels, and biodiversity worldwide.';

                // Test brief style
                const briefResult = await aiService.summarize({
                    content: testContent,
                    style: 'brief',
                });

                // Test detailed style
                const detailedResult = await aiService.summarize({
                    content: testContent,
                    style: 'detailed',
                });

                // Test bullet-points style
                const bulletResult = await aiService.summarize({
                    content: testContent,
                    style: 'bullet-points',
                });

                expect(briefResult.summary).toBeDefined();
                expect(detailedResult.summary).toBeDefined();
                expect(bulletResult.summary).toBeDefined();

                console.log('Style comparison:', {
                    brief: briefResult.summary,
                    detailed: detailedResult.summary,
                    bulletPoints: bulletResult.summary,
                });
            },
            TEST_TIMEOUT
        );

        test(
            'should handle empty content gracefully',
            async () => {
                await expect(
                    aiService.summarize({
                        content: '',
                    })
                ).rejects.toThrow();
            },
            TEST_TIMEOUT
        );

        test(
            'should handle very short content',
            async () => {
                const result = await aiService.summarize({
                    content: 'Short text.',
                });

                expect(result).toBeDefined();
                expect(result.summary).toBeDefined();
                expect(result.originalLength).toBe(11); // 'Short text.' length
            },
            TEST_TIMEOUT
        );

        test(
            'should handle large content',
            async () => {
                // Generate a longer text
                const longContent = Array(100)
                    .fill(
                        'This is a sentence about artificial intelligence and machine learning. '
                    )
                    .join('');

                const result = await aiService.summarize({
                    content: longContent,
                    maxLength: 200,
                });

                expect(result).toBeDefined();
                expect(result.summary).toBeDefined();
                expect(result.originalLength).toBe(longContent.length);
                expect(result.compressionRatio).toBeLessThan(0.5); // Should be significantly compressed
            },
            TEST_TIMEOUT
        );

        test(
            'should handle network errors gracefully',
            async () => {
                // Create service with invalid base URL to simulate network error
                const invalidService = new AIInferenceService({
                    user: auth.currentUser!,
                    functionUrl: 'http://invalid-url-that-should-fail.com',
                });

                await expect(
                    invalidService.summarize({
                        content: 'Test content',
                    })
                ).rejects.toThrow();
            },
            TEST_TIMEOUT
        );
    });

    // ========================================
    // GenKit callLLM Tests
    // ========================================

    describe('genkitCallLLM', () => {
        test(
            'should call LLM with default parameters',
            async () => {
                const testPrompt = 'What is the capital of France?';

                const result = await aiService.callLLM({
                    prompt: testPrompt,
                });

                expect(result).toBeDefined();
                expect(result.response).toBeDefined();
                expect(typeof result.response).toBe('string');
                expect(result.response.length).toBeGreaterThan(0);
                expect(result.promptLength).toBe(testPrompt.length);
                expect(result.responseLength).toBe(result.response.length);

                console.log('callLLM result:', {
                    promptLength: result.promptLength,
                    responseLength: result.responseLength,
                    response: result.response,
                });
            },
            TEST_TIMEOUT
        );

        test(
            'should call LLM with custom parameters',
            async () => {
                const testPrompt = 'Write a short poem about nature.';

                const result = await aiService.callLLM({
                    prompt: testPrompt,
                    maxTokens: 50,
                    temperature: 0.7,
                });

                expect(result).toBeDefined();
                expect(result.response).toBeDefined();
                expect(typeof result.response).toBe('string');
                expect(result.response.length).toBeGreaterThan(0);
                expect(result.promptLength).toBe(testPrompt.length);
                expect(result.responseLength).toBe(result.response.length);

                console.log('callLLM with custom parameters:', {
                    prompt: testPrompt,
                    response: result.response,
                    responseLength: result.responseLength,
                });
            },
            TEST_TIMEOUT
        );

        test(
            'should handle complex prompts',
            async () => {
                const complexPrompt = `
                Please analyze the following scenario and provide a recommendation:
                A company is deciding between two software solutions. Solution A costs $10,000 upfront 
                with $500/month maintenance. Solution B costs $5,000 upfront with $800/month maintenance.
                They plan to use it for 3 years. Which is more cost-effective?
            `;

                const result = await aiService.callLLM({
                    prompt: complexPrompt,
                    maxTokens: 200,
                });

                expect(result).toBeDefined();
                expect(result.response).toBeDefined();
                expect(typeof result.response).toBe('string');
                expect(result.response.length).toBeGreaterThan(0);
                expect(result.promptLength).toBe(complexPrompt.length);

                console.log('Complex prompt result:', {
                    promptLength: result.promptLength,
                    responseLength: result.responseLength,
                    response: result.response.substring(0, 200) + '...',
                });
            },
            TEST_TIMEOUT
        );

        test(
            'should handle empty prompt gracefully',
            async () => {
                await expect(
                    aiService.callLLM({
                        prompt: '',
                    })
                ).rejects.toThrow();
            },
            TEST_TIMEOUT
        );

        test(
            'should handle network errors gracefully',
            async () => {
                // Create service with invalid base URL to simulate network error
                const invalidService = new AIInferenceService({
                    user: auth.currentUser!,
                    functionUrl: 'http://invalid-url-that-should-fail.com',
                });

                await expect(
                    invalidService.callLLM({
                        prompt: 'Test prompt',
                    })
                ).rejects.toThrow();
            },
            TEST_TIMEOUT
        );

        test(
            'should handle different temperature values',
            async () => {
                const testPrompt =
                    'Generate a creative story opening sentence.';

                // Test low temperature (more deterministic)
                const lowTempResult = await aiService.callLLM({
                    prompt: testPrompt,
                    temperature: 0.1,
                });

                // Test high temperature (more creative)
                const highTempResult = await aiService.callLLM({
                    prompt: testPrompt,
                    temperature: 0.9,
                });

                expect(lowTempResult.response).toBeDefined();
                expect(highTempResult.response).toBeDefined();
                expect(typeof lowTempResult.response).toBe('string');
                expect(typeof highTempResult.response).toBe('string');

                console.log('Temperature comparison:', {
                    lowTemp: lowTempResult.response,
                    highTemp: highTempResult.response,
                });
            },
            TEST_TIMEOUT
        );

        test(
            'should handle different max token limits',
            async () => {
                const testPrompt = 'Explain artificial intelligence in detail.';

                // Test with small token limit
                const shortResult = await aiService.callLLM({
                    prompt: testPrompt,
                    maxTokens: 20,
                });

                // Test with larger token limit
                const longResult = await aiService.callLLM({
                    prompt: testPrompt,
                    maxTokens: 100,
                });

                expect(shortResult.response).toBeDefined();
                expect(longResult.response).toBeDefined();
                expect(shortResult.responseLength).toBeLessThanOrEqual(
                    longResult.responseLength
                );

                console.log('Max tokens comparison:', {
                    shortResponse: shortResult.response,
                    longResponse: longResult.response.substring(0, 200) + '...',
                    shortLength: shortResult.responseLength,
                    longLength: longResult.responseLength,
                });
            },
            TEST_TIMEOUT
        );
    });

    // ========================================
    // GenKit Text Formatting Tests
    // ========================================

    describe('formatText', () => {
        test(
            'should format text with default parameters',
            async () => {
                const testText =
                    'Machine learning is a subset of artificial intelligence. It uses algorithms to analyze data and make predictions.';
                const formatRules =
                    'Convert to a numbered list with each sentence as a separate item';

                const result = await aiService.formatText({
                    text: testText,
                    formatRules: formatRules,
                });

                expect(result).toBeDefined();
                expect(result.formattedText).toBeDefined();
                expect(typeof result.formattedText).toBe('string');
                expect(result.formattedText.length).toBeGreaterThan(0);
                expect(result.originalLength).toBe(testText.length);
                expect(result.formattedLength).toBe(
                    result.formattedText.length
                );
                expect(result.compressionRatio).toBeGreaterThan(0);
                expect(result.formatApplied).toBeDefined();

                console.log('Text formatting result:', {
                    originalLength: result.originalLength,
                    formattedLength: result.formattedLength,
                    compressionRatio: result.compressionRatio,
                    formattedText: result.formattedText,
                });
            },
            TEST_TIMEOUT
        );

        test(
            'should format text with markdown output type',
            async () => {
                const testText =
                    'Deep learning uses neural networks. It processes complex patterns. Applications include image recognition and natural language processing.';
                const formatRules =
                    'Convert to markdown with headers and bullet points';

                const result = await aiService.formatText({
                    text: testText,
                    formatRules: formatRules,
                    outputType: 'markdown',
                });

                expect(result).toBeDefined();
                expect(result.formattedText).toBeDefined();
                expect(typeof result.formattedText).toBe('string');
                expect(result.formattedText.length).toBeGreaterThan(0);
                expect(result.formatApplied).toContain('markdown');

                console.log('Markdown formatting result:', {
                    formattedText: result.formattedText,
                    formatApplied: result.formatApplied,
                });
            },
            TEST_TIMEOUT
        );

        test(
            'should format text with html output type',
            async () => {
                const testText =
                    'Artificial intelligence encompasses machine learning and deep learning. These technologies enable computers to perform human-like tasks.';
                const formatRules =
                    'Convert to HTML with proper paragraph and list tags';

                const result = await aiService.formatText({
                    text: testText,
                    formatRules: formatRules,
                    outputType: 'html',
                });

                expect(result).toBeDefined();
                expect(result.formattedText).toBeDefined();
                expect(typeof result.formattedText).toBe('string');
                expect(result.formattedText.length).toBeGreaterThan(0);
                expect(result.formatApplied).toContain('html');

                console.log('HTML formatting result:', {
                    formattedText: result.formattedText,
                    formatApplied: result.formatApplied,
                });
            },
            TEST_TIMEOUT
        );

        test(
            'should format text with json output type',
            async () => {
                const testText =
                    'Natural language processing enables computers to understand human language. Computer vision allows machines to interpret visual information.';
                const formatRules =
                    'Convert to JSON with key-value pairs for each concept';

                const result = await aiService.formatText({
                    text: testText,
                    formatRules: formatRules,
                    outputType: 'json',
                });

                expect(result).toBeDefined();
                expect(result.formattedText).toBeDefined();
                expect(typeof result.formattedText).toBe('string');
                expect(result.formattedText.length).toBeGreaterThan(0);
                expect(result.formatApplied).toContain('json');

                console.log('JSON formatting result:', {
                    formattedText: result.formattedText,
                    formatApplied: result.formatApplied,
                });
            },
            TEST_TIMEOUT
        );

        test(
            'should format text with structured output type',
            async () => {
                const testText =
                    'Data science combines statistics, programming, and domain expertise. It involves data collection, cleaning, analysis, and visualization.';
                const formatRules = 'Organize into clear sections with headers';

                const result = await aiService.formatText({
                    text: testText,
                    formatRules: formatRules,
                    outputType: 'structured',
                });

                expect(result).toBeDefined();
                expect(result.formattedText).toBeDefined();
                expect(typeof result.formattedText).toBe('string');
                expect(result.formattedText.length).toBeGreaterThan(0);
                expect(result.formatApplied).toContain('structured');

                console.log('Structured formatting result:', {
                    formattedText: result.formattedText,
                    formatApplied: result.formatApplied,
                });
            },
            TEST_TIMEOUT
        );

        test(
            'should respect preserveContent setting',
            async () => {
                const testText =
                    'Machine learning algorithms can be supervised, unsupervised, or reinforcement learning. Each type serves different purposes and applications.';
                const formatRules = 'Summarize into 2 key points';

                const preserveResult = await aiService.formatText({
                    text: testText,
                    formatRules: formatRules,
                    preserveContent: true,
                });

                const condensedResult = await aiService.formatText({
                    text: testText,
                    formatRules: formatRules,
                    preserveContent: false,
                });

                expect(preserveResult).toBeDefined();
                expect(condensedResult).toBeDefined();
                expect(preserveResult.formattedText).toBeDefined();
                expect(condensedResult.formattedText).toBeDefined();

                console.log('Content preservation comparison:', {
                    preserved: preserveResult.formattedText,
                    condensed: condensedResult.formattedText,
                });
            },
            TEST_TIMEOUT
        );

        test(
            'should respect maxOutputLength setting',
            async () => {
                const testText =
                    'The field of artificial intelligence has grown exponentially in recent years, encompassing machine learning, deep learning, natural language processing, computer vision, and robotics.';
                const formatRules =
                    'Reformat with line breaks after each concept';

                const result = await aiService.formatText({
                    text: testText,
                    formatRules: formatRules,
                    maxOutputLength: 100,
                });

                expect(result).toBeDefined();
                expect(result.formattedText).toBeDefined();
                expect(typeof result.formattedText).toBe('string');
                expect(result.formattedText.length).toBeLessThanOrEqual(120); // Allow some tolerance

                console.log('Max length formatting result:', {
                    originalLength: result.originalLength,
                    formattedLength: result.formattedLength,
                    formattedText: result.formattedText,
                });
            },
            TEST_TIMEOUT
        );

        test(
            'should handle complex formatting rules',
            async () => {
                const testText =
                    'Cloud computing provides on-demand access to computing resources. It offers scalability, flexibility, and cost-effectiveness for businesses.';
                const formatRules =
                    'Break into individual words, number each word, and format as a vertical list with proper spacing';

                const result = await aiService.formatText({
                    text: testText,
                    formatRules: formatRules,
                    outputType: 'structured',
                });

                expect(result).toBeDefined();
                expect(result.formattedText).toBeDefined();
                expect(typeof result.formattedText).toBe('string');
                expect(result.formattedText.length).toBeGreaterThan(0);

                console.log('Complex formatting result:', {
                    formattedText: result.formattedText,
                    compressionRatio: result.compressionRatio,
                });
            },
            TEST_TIMEOUT
        );

        test(
            'should handle empty text gracefully',
            async () => {
                await expect(
                    aiService.formatText({
                        text: '',
                        formatRules: 'Format as list',
                    })
                ).rejects.toThrow();
            },
            TEST_TIMEOUT
        );

        test(
            'should handle empty format rules gracefully',
            async () => {
                await expect(
                    aiService.formatText({
                        text: 'Some text',
                        formatRules: '',
                    })
                ).rejects.toThrow();
            },
            TEST_TIMEOUT
        );

        test(
            'should handle network errors gracefully',
            async () => {
                const invalidService = new AIInferenceService({
                    user: auth.currentUser!,
                    functionUrl: 'http://invalid-url-that-should-fail.com',
                });

                await expect(
                    invalidService.formatText({
                        text: 'Test text',
                        formatRules: 'Format as list',
                    })
                ).rejects.toThrow();
            },
            TEST_TIMEOUT
        );

        test(
            'should calculate compression ratio correctly',
            async () => {
                const shortText = 'AI is transformative.';
                const formatRules = 'Add prefix "Formatted: " to the text';

                const result = await aiService.formatText({
                    text: shortText,
                    formatRules: formatRules,
                });

                expect(result.originalLength).toBe(shortText.length);
                expect(result.formattedLength).toBe(
                    result.formattedText.length
                );
                expect(result.compressionRatio).toBe(
                    Math.round(
                        (result.formattedLength / result.originalLength) * 100
                    ) / 100
                );

                console.log('Compression ratio test:', {
                    originalLength: result.originalLength,
                    formattedLength: result.formattedLength,
                    compressionRatio: result.compressionRatio,
                });
            },
            TEST_TIMEOUT
        );

        test(
            'should handle expansion ratio correctly',
            async () => {
                const shortText = 'ML.';
                const formatRules =
                    'Expand the abbreviation and add detailed explanation';

                const result = await aiService.formatText({
                    text: shortText,
                    formatRules: formatRules,
                });

                expect(result.originalLength).toBe(shortText.length);
                expect(result.formattedLength).toBe(
                    result.formattedText.length
                );
                expect(result.compressionRatio).toBeGreaterThan(1); // Should be expansion

                console.log('Expansion ratio test:', {
                    originalText: shortText,
                    formattedText: result.formattedText,
                    compressionRatio: result.compressionRatio,
                });
            },
            TEST_TIMEOUT
        );

        test(
            'should handle different output types with same content',
            async () => {
                const testText =
                    'Blockchain technology provides decentralized, secure, and transparent transactions.';
                const formatRules = 'List the key benefits mentioned';

                const outputTypes = [
                    'plain',
                    'markdown',
                    'html',
                    'structured',
                ] as const;
                const results = await Promise.all(
                    outputTypes.map((outputType) =>
                        aiService.formatText({
                            text: testText,
                            formatRules: formatRules,
                            outputType: outputType,
                        })
                    )
                );

                results.forEach((result, index) => {
                    expect(result).toBeDefined();
                    expect(result.formattedText).toBeDefined();
                    expect(result.formatApplied).toContain(outputTypes[index]);
                });

                console.log('Output type comparison:', {
                    plain: results[0].formattedText,
                    markdown: results[1].formattedText,
                    html: results[2].formattedText,
                    structured: results[3].formattedText,
                });
            },
            TEST_TIMEOUT
        );
    });

    // ========================================
    // GenKitSummarizationNode Integration Tests
    // ========================================

    describe('GenKitSummarizationNode Integration', () => {
        test(
            'should execute summarization node with default parameters',
            async () => {
                const testContent =
                    'Artificial intelligence is transforming how we work and live. Machine learning algorithms can process data and make decisions faster than ever before.';

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
                                style: 'brief',
                            },
                        },
                    },
                ];

                await executeFlowGraph(
                    'genkit-summarization-test',
                    nodes,
                    edges
                );

                // Check outputs
                const summary = await projectComputedDataCache.get(
                    'genkit-summarization-test',
                    'summary'
                );
                const originalLength = await projectComputedDataCache.get(
                    'genkit-summarization-test',
                    'originalLength'
                );
                const summaryLength = await projectComputedDataCache.get(
                    'genkit-summarization-test',
                    'summaryLength'
                );
                const compressionRatio = await projectComputedDataCache.get(
                    'genkit-summarization-test',
                    'compressionRatio'
                );

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
                    compressionRatio,
                });
            },
            TEST_TIMEOUT
        );

        test(
            'should execute summarization node with custom parameters',
            async () => {
                const testContent =
                    'The evolution of technology has accelerated rapidly in the past decade. From smartphones to artificial intelligence, innovations continue to reshape our daily lives and work environments.';

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
                                style: 'detailed',
                            },
                        },
                    },
                ];

                await executeFlowGraph(
                    'genkit-summarization-custom-test',
                    nodes,
                    edges
                );

                const summary = await projectComputedDataCache.get(
                    'genkit-summarization-custom-test',
                    'summary'
                );
                const compressionRatio = await projectComputedDataCache.get(
                    'genkit-summarization-custom-test',
                    'compressionRatio'
                );

                expect(summary).toBeDefined();
                expect(typeof summary).toBe('string');
                expect(compressionRatio).toBeGreaterThan(0);

                console.log('Custom parameters result:', {
                    summary,
                    compressionRatio,
                });
            },
            TEST_TIMEOUT
        );

        test(
            'should handle bullet-points style',
            async () => {
                const testContent =
                    'Key benefits of renewable energy include reduced carbon emissions, energy independence, job creation, and long-term cost savings. Solar and wind power are becoming increasingly affordable and efficient.';

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
                                style: 'bullet-points',
                            },
                        },
                    },
                ];

                await executeFlowGraph(
                    'genkit-summarization-bullets-test',
                    nodes,
                    edges
                );

                const summary = await projectComputedDataCache.get(
                    'genkit-summarization-bullets-test',
                    'summary'
                );
                expect(summary).toBeDefined();
                expect(typeof summary).toBe('string');

                console.log('Bullet points summary:', summary);
            },
            TEST_TIMEOUT
        );

        test(
            'should fail gracefully with invalid content',
            async () => {
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
                                style: 'brief',
                            },
                        },
                    },
                ];

                const result = await executeFlowGraph(
                    'genkit-summarization-invalid-test',
                    nodes,
                    edges
                );

                expect(result.success).toBe(false);
                expect(result.error).toBeDefined();
                expect(result.error).toContain('Content input is required');
            },
            TEST_TIMEOUT
        );

        test(
            'should fail gracefully with empty content',
            async () => {
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
                                style: 'brief',
                            },
                        },
                    },
                ];

                const result = await executeFlowGraph(
                    'genkit-summarization-empty-test',
                    nodes,
                    edges
                );

                expect(result.success).toBe(false);
                expect(result.error).toBeDefined();
            },
            TEST_TIMEOUT
        );

        test(
            'should handle authentication errors',
            async () => {
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
                                style: 'brief',
                            },
                        },
                    },
                ];

                const result = await executeFlowGraph(
                    'genkit-summarization-unauth-test',
                    nodes,
                    edges
                );

                expect(result.success).toBe(false);
                expect(result.error).toContain('User must be authenticated');

                // Sign back in for other tests
                await signInAnonymously(auth);
            },
            TEST_TIMEOUT
        );
    });
});
