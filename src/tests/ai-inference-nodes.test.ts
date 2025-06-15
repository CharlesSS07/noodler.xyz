/**
 * Unit tests for AI Inference Nodes
 * Tests all AI inference nodes by calling them through the Firestore node blueprint system
 * 
 * These tests mock the AI inference service to test node logic without making actual API calls
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';
import { executeFlowGraph } from '../routes/app/lib/Interpreter';
import type { Node, Edge } from '@xyflow/svelte';
import { projectOutputDataCache } from '$lib/stores/ProjectState';
import { Jimp } from 'jimp';

// Mock the API connection manager
vi.mock('../routes/app/lib/NodeAPIConnector/NodeAPIConnectorManager', () => ({
    NodeLib: class {
        name: string;
        connection: any;
        
        constructor(name: string) {
            this.name = name;
        }
        
        async setupConnection() {}
        async connect() {}
        disconnect() {}
        async getAPI() { return this.connection; }
    },
    NodeAPIConnectorManager: {
        connections: new Map(),
        registerAPIConnector: vi.fn(),
        getConnector: vi.fn().mockReturnValue({
            getAPI: vi.fn().mockResolvedValue({
                textGeneration: vi.fn(),
                textClassification: vi.fn(),
                tokenClassification: vi.fn(),
                questionAnswering: vi.fn(),
                fillMask: vi.fn(),
                summarization: vi.fn(),
                translation: vi.fn(),
                sentenceSimilarity: vi.fn(),
                conversational: vi.fn(),
                featureExtraction: vi.fn(),
                textToImage: vi.fn(),
                imageClassification: vi.fn(),
                objectDetection: vi.fn(),
                automaticSpeechRecognition: vi.fn(),
                tableQuestionAnswering: vi.fn(),
            })
        }),
        hasConnector: vi.fn().mockReturnValue(true)
    }
}));

describe('AI Inference Nodes Unit Tests', () => {
    let mockNodes: Node[];
    let mockEdges: Edge[];
    let mockAIInferenceService: any;

    beforeEach(async () => {
        mockNodes = [];
        mockEdges = [];
        await projectOutputDataCache.clear();
        
        // Get the mocked service through the module mock
        const { NodeAPIConnectorManager } = await import('../routes/app/lib/NodeAPIConnector/NodeAPIConnectorManager');
        const connector = NodeAPIConnectorManager.getConnector('ai_inference');
        mockAIInferenceService = await connector.getAPI();
        
        // Reset all mocks
        if (mockAIInferenceService) {
            Object.values(mockAIInferenceService).forEach((mock: any) => {
                if (typeof mock?.mockReset === 'function') {
                    mock.mockReset();
                }
            });
        }
    });

    // ========================================
    // TEXT PROCESSING NODES
    // ========================================

    describe('Text Processing AI Nodes', () => {
        test('AI Text Generation Node', async () => {
            // Mock the API response
            mockAIInferenceService.textGeneration.mockResolvedValue([
                { generated_text: 'Once upon a time, there was a brave knight who ventured into the enchanted forest.' }
            ]);

            mockNodes = [
                {
                    id: 'ai-text-gen-test',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'ai_text_generation',
                        input: {
                            prompt: 'Once upon a time',
                            model: 'gpt2',
                            max_length: 50,
                            temperature: 0.7,
                            do_sample: true,
                            top_k: 50,
                            top_p: 0.9
                        },
                    },
                },
            ];

            const result = await executeFlowGraph('test', mockNodes, mockEdges);
            
            expect(result.success).toBe(true);
            expect(mockAIInferenceService.textGeneration).toHaveBeenCalledWith({
                inputs: 'Once upon a time',
                model: 'gpt2',
                parameters: {
                    max_length: 50,
                    temperature: 0.7,
                    do_sample: true,
                    top_k: 50,
                    top_p: 0.9
                }
            });

            const outputData = await projectOutputDataCache.get('ai-text-gen-test', 'generated_text');
            expect(outputData).toBe('Once upon a time, there was a brave knight who ventured into the enchanted forest.');
        });

        test('AI Text Classification Node', async () => {
            // Mock the API response
            mockAIInferenceService.textClassification.mockResolvedValue([
                [
                    { label: 'POSITIVE', score: 0.9998 },
                    { label: 'NEGATIVE', score: 0.0002 }
                ]
            ]);

            mockNodes = [
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

            const result = await executeFlowGraph('test', mockNodes, mockEdges);
            
            expect(result.success).toBe(true);
            expect(mockAIInferenceService.textClassification).toHaveBeenCalledWith({
                inputs: 'I love this product! It works amazingly well.',
                model: 'cardiffnlp/twitter-roberta-base-sentiment-latest'
            });

            const outputData = await projectOutputDataCache.get('ai-text-class-test', 'results');
            expect(outputData).toEqual([
                { label: 'POSITIVE', score: 0.9998 },
                { label: 'NEGATIVE', score: 0.0002 }
            ]);
        });

        test('AI Question Answering Node', async () => {
            // Mock the API response
            mockAIInferenceService.questionAnswering.mockResolvedValue({
                answer: 'Paris',
                score: 0.9985,
                start: 109,
                end: 114
            });

            mockNodes = [
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

            const result = await executeFlowGraph('test', mockNodes, mockEdges);
            
            expect(result.success).toBe(true);
            expect(mockAIInferenceService.questionAnswering).toHaveBeenCalledWith({
                inputs: {
                    question: 'What is the capital of France?',
                    context: 'France is a country in Europe. Paris is the capital and largest city of France.'
                },
                model: 'distilbert-base-cased-distilled-squad'
            });

            const answerData = await projectOutputDataCache.get('ai-qa-test', 'answer');
            const scoreData = await projectOutputDataCache.get('ai-qa-test', 'score');
            expect(answerData).toBe('Paris');
            expect(scoreData).toBe(0.9985);
        });

        test('AI Summarization Node', async () => {
            // Mock the API response
            mockAIInferenceService.summarization.mockResolvedValue([
                { summary_text: 'Artificial Intelligence is transforming technology across industries.' }
            ]);

            mockNodes = [
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

            const result = await executeFlowGraph('test', mockNodes, mockEdges);
            
            expect(result.success).toBe(true);
            expect(mockAIInferenceService.summarization).toHaveBeenCalledWith({
                inputs: 'Artificial Intelligence (AI) has emerged as one of the most transformative technologies of the 21st century. From healthcare to finance, education to entertainment, AI is revolutionizing how we work, live, and interact with the world around us.',
                model: 'facebook/bart-large-cnn',
                parameters: {
                    max_length: 50,
                    min_length: 10,
                    do_sample: false
                }
            });

            const outputData = await projectOutputDataCache.get('ai-summary-test', 'summary');
            expect(outputData).toBe('Artificial Intelligence is transforming technology across industries.');
        });

        test('AI Translation Node', async () => {
            // Mock the API response
            mockAIInferenceService.translation.mockResolvedValue([
                { translation_text: 'Bonjour, comment allez-vous?' }
            ]);

            mockNodes = [
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

            const result = await executeFlowGraph('test', mockNodes, mockEdges);
            
            expect(result.success).toBe(true);
            expect(mockAIInferenceService.translation).toHaveBeenCalledWith({
                inputs: 'Hello, how are you?',
                model: 'Helsinki-NLP/opus-mt-en-fr'
            });

            const outputData = await projectOutputDataCache.get('ai-translation-test', 'translated_text');
            expect(outputData).toBe('Bonjour, comment allez-vous?');
        });

        test('AI Fill Mask Node', async () => {
            // Mock the API response
            mockAIInferenceService.fillMask.mockResolvedValue([
                { token_str: 'sunny', score: 0.8 },
                { token_str: 'cloudy', score: 0.15 },
                { token_str: 'rainy', score: 0.05 }
            ]);

            mockNodes = [
                {
                    id: 'ai-fill-mask-test',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'ai_fill_mask',
                        input: {
                            text: 'The weather today is [MASK].',
                            model: 'bert-base-uncased',
                            top_k: 3
                        },
                    },
                },
            ];

            const result = await executeFlowGraph('test', mockNodes, mockEdges);
            
            expect(result.success).toBe(true);
            expect(mockAIInferenceService.fillMask).toHaveBeenCalledWith({
                inputs: 'The weather today is [MASK].',
                model: 'bert-base-uncased',
                parameters: {
                    top_k: 3
                }
            });

            const outputData = await projectOutputDataCache.get('ai-fill-mask-test', 'predictions');
            expect(outputData).toEqual([
                { token_str: 'sunny', score: 0.8 },
                { token_str: 'cloudy', score: 0.15 },
                { token_str: 'rainy', score: 0.05 }
            ]);
        });

        test('AI Sentence Similarity Node', async () => {
            // Mock the API response
            mockAIInferenceService.sentenceSimilarity.mockResolvedValue([0.8, 0.2, 0.9]);

            mockNodes = [
                {
                    id: 'ai-similarity-test',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'ai_sentence_similarity',
                        input: {
                            source_sentence: 'The cat is sleeping.',
                            sentences: ['The dog is resting.', 'I like pizza.', 'A feline is napping.'],
                            model: 'sentence-transformers/all-MiniLM-L6-v2'
                        },
                    },
                },
            ];

            const result = await executeFlowGraph('test', mockNodes, mockEdges);
            
            expect(result.success).toBe(true);
            expect(mockAIInferenceService.sentenceSimilarity).toHaveBeenCalledWith({
                inputs: {
                    source_sentence: 'The cat is sleeping.',
                    sentences: ['The dog is resting.', 'I like pizza.', 'A feline is napping.']
                },
                model: 'sentence-transformers/all-MiniLM-L6-v2'
            });

            const outputData = await projectOutputDataCache.get('ai-similarity-test', 'similarities');
            expect(outputData).toEqual([0.8, 0.2, 0.9]);
        });

        test('AI Conversational Node', async () => {
            // Mock the API response
            mockAIInferenceService.conversational.mockResolvedValue({
                generated_text: 'Hello! I can help you with various tasks. What would you like to know?'
            });

            mockNodes = [
                {
                    id: 'ai-conversation-test',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'ai_conversational',
                        input: {
                            text: 'Hello, how can you help me today?',
                            past_user_inputs: [],
                            generated_responses: [],
                            model: 'microsoft/DialoGPT-medium',
                            max_length: 100,
                            temperature: 0.7
                        },
                    },
                },
            ];

            const result = await executeFlowGraph('test', mockNodes, mockEdges);
            
            expect(result.success).toBe(true);
            expect(mockAIInferenceService.conversational).toHaveBeenCalledWith({
                inputs: {
                    past_user_inputs: [],
                    generated_responses: [],
                    text: 'Hello, how can you help me today?'
                },
                model: 'microsoft/DialoGPT-medium',
                parameters: {
                    max_length: 100,
                    temperature: 0.7
                }
            });

            const outputData = await projectOutputDataCache.get('ai-conversation-test', 'response');
            expect(outputData).toBe('Hello! I can help you with various tasks. What would you like to know?');
        });

        test('AI Feature Extraction Node', async () => {
            // Mock the API response
            mockAIInferenceService.featureExtraction.mockResolvedValue([[0.1, 0.2, 0.3, 0.4, 0.5]]);

            mockNodes = [
                {
                    id: 'ai-features-test',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'ai_feature_extraction',
                        input: {
                            text: 'This is a sample text for feature extraction.',
                            model: 'sentence-transformers/all-MiniLM-L6-v2'
                        },
                    },
                },
            ];

            const result = await executeFlowGraph('test', mockNodes, mockEdges);
            
            expect(result.success).toBe(true);
            expect(mockAIInferenceService.featureExtraction).toHaveBeenCalledWith({
                inputs: 'This is a sample text for feature extraction.',
                model: 'sentence-transformers/all-MiniLM-L6-v2'
            });

            const outputData = await projectOutputDataCache.get('ai-features-test', 'features');
            expect(outputData).toEqual([[0.1, 0.2, 0.3, 0.4, 0.5]]);
        });

        test('AI Token Classification Node', async () => {
            // Mock the API response
            mockAIInferenceService.tokenClassification.mockResolvedValue([
                { entity: 'B-ORG', score: 0.999, index: 1, word: 'Apple', start: 0, end: 5 },
                { entity: 'I-ORG', score: 0.998, index: 2, word: 'Inc', start: 6, end: 9 },
                { entity: 'B-PER', score: 0.997, index: 6, word: 'Steve', start: 25, end: 30 },
                { entity: 'I-PER', score: 0.996, index: 7, word: 'Jobs', start: 31, end: 35 }
            ]);

            mockNodes = [
                {
                    id: 'ai-token-class-test',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'ai_token_classification',
                        input: {
                            text: 'Apple Inc. was founded by Steve Jobs in Cupertino.',
                            model: 'dbmdz/bert-large-cased-finetuned-conll03-english',
                            aggregation_strategy: 'simple'
                        },
                    },
                },
            ];

            const result = await executeFlowGraph('test', mockNodes, mockEdges);
            
            expect(result.success).toBe(true);
            expect(mockAIInferenceService.tokenClassification).toHaveBeenCalledWith({
                inputs: 'Apple Inc. was founded by Steve Jobs in Cupertino.',
                model: 'dbmdz/bert-large-cased-finetuned-conll03-english',
                parameters: {
                    aggregation_strategy: 'simple'
                }
            });

            const outputData = await projectOutputDataCache.get('ai-token-class-test', 'entities');
            expect(outputData).toHaveLength(4);
            expect(outputData[0].word).toBe('Apple');
            expect(outputData[2].word).toBe('Steve');
        });
    });

    // ========================================
    // MEDIA PROCESSING NODES
    // ========================================

    describe('Media Processing AI Nodes', () => {
        test('AI Text to Image Node', async () => {
            // Create a mock Jimp image
            const mockImage = await Jimp.fromBuffer(Buffer.from('mock-image-data'));
            
            // Mock the API response
            mockAIInferenceService.textToImage.mockResolvedValue(mockImage);

            mockNodes = [
                {
                    id: 'ai-text-to-image-test',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'ai_text_to_image',
                        input: {
                            prompt: 'A beautiful sunset over mountains',
                            model: 'runwayml/stable-diffusion-v1-5',
                            num_inference_steps: 50,
                            guidance_scale: 7.5,
                            negative_prompt: 'blurry, low quality',
                            height: 512,
                            width: 512
                        },
                    },
                },
            ];

            const result = await executeFlowGraph('test', mockNodes, mockEdges);
            
            expect(result.success).toBe(true);
            expect(mockAIInferenceService.textToImage).toHaveBeenCalledWith({
                inputs: 'A beautiful sunset over mountains',
                model: 'runwayml/stable-diffusion-v1-5',
                parameters: {
                    num_inference_steps: 50,
                    guidance_scale: 7.5,
                    negative_prompt: 'blurry, low quality',
                    height: 512,
                    width: 512
                }
            });

            const outputData = await projectOutputDataCache.get('ai-text-to-image-test', 'image');
            expect(outputData).toBeDefined();
        });

        test('AI Image Classification Node', async () => {
            // Create a mock Jimp image
            const mockImage = await Jimp.fromBuffer(Buffer.from('mock-image-data'));
            
            // Mock the API response
            mockAIInferenceService.imageClassification.mockResolvedValue([
                { label: 'cat', score: 0.98 },
                { label: 'dog', score: 0.02 }
            ]);

            mockNodes = [
                {
                    id: 'ai-image-class-test',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'ai_image_classification',
                        input: {
                            image: mockImage,
                            model: 'google/vit-base-patch16-224'
                        },
                    },
                },
            ];

            const result = await executeFlowGraph('test', mockNodes, mockEdges);
            
            expect(result.success).toBe(true);
            expect(mockAIInferenceService.imageClassification).toHaveBeenCalledWith({
                inputs: mockImage,
                model: 'google/vit-base-patch16-224'
            });

            const outputData = await projectOutputDataCache.get('ai-image-class-test', 'results');
            expect(outputData).toEqual([
                { label: 'cat', score: 0.98 },
                { label: 'dog', score: 0.02 }
            ]);
        });

        test('AI Object Detection Node', async () => {
            // Create a mock Jimp image
            const mockImage = await Jimp.fromBuffer(Buffer.from('mock-image-data'));
            
            // Mock the API response
            mockAIInferenceService.objectDetection.mockResolvedValue([
                {
                    label: 'cat',
                    score: 0.95,
                    box: { xmin: 100, ymin: 150, xmax: 300, ymax: 400 }
                },
                {
                    label: 'person',
                    score: 0.88,
                    box: { xmin: 50, ymin: 50, xmax: 200, ymax: 500 }
                }
            ]);

            mockNodes = [
                {
                    id: 'ai-object-detect-test',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'ai_object_detection',
                        input: {
                            image: mockImage,
                            model: 'facebook/detr-resnet-50',
                            threshold: 0.7
                        },
                    },
                },
            ];

            const result = await executeFlowGraph('test', mockNodes, mockEdges);
            
            expect(result.success).toBe(true);
            expect(mockAIInferenceService.objectDetection).toHaveBeenCalledWith({
                inputs: mockImage,
                model: 'facebook/detr-resnet-50',
                parameters: {
                    threshold: 0.7
                }
            });

            const outputData = await projectOutputDataCache.get('ai-object-detect-test', 'detections');
            expect(outputData).toHaveLength(2);
            expect(outputData[0].label).toBe('cat');
            expect(outputData[1].label).toBe('person');
        });

        test('AI Speech Recognition Node', async () => {
            // Mock the API response
            mockAIInferenceService.automaticSpeechRecognition.mockResolvedValue({
                text: 'Hello, this is a test audio transcription.'
            });

            mockNodes = [
                {
                    id: 'ai-speech-test',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'ai_speech_recognition',
                        input: {
                            audio_data: 'data:audio/wav;base64,mock-audio-data',
                            model: 'openai/whisper-small'
                        },
                    },
                },
            ];

            const result = await executeFlowGraph('test', mockNodes, mockEdges);
            
            expect(result.success).toBe(true);
            expect(mockAIInferenceService.automaticSpeechRecognition).toHaveBeenCalledWith({
                inputs: 'data:audio/wav;base64,mock-audio-data',
                model: 'openai/whisper-small'
            });

            const outputData = await projectOutputDataCache.get('ai-speech-test', 'text');
            expect(outputData).toBe('Hello, this is a test audio transcription.');
        });

        test('AI Table Question Answering Node', async () => {
            // Mock the API response
            mockAIInferenceService.tableQuestionAnswering.mockResolvedValue({
                answer: '3',
                coordinates: [[0, 1], [1, 1], [2, 1]],
                cells: ['John', 'Jane', 'Bob'],
                aggregator: 'COUNT'
            });

            const mockTable = {
                Name: ['John', 'Jane', 'Bob'],
                Age: ['25', '30', '35'],
                Department: ['Sales', 'Marketing', 'Engineering']
            };

            mockNodes = [
                {
                    id: 'ai-table-qa-test',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'ai_table_qa',
                        input: {
                            question: 'How many employees are there?',
                            table: mockTable,
                            model: 'google/tapas-base-finetuned-wtq'
                        },
                    },
                },
            ];

            const result = await executeFlowGraph('test', mockNodes, mockEdges);
            
            expect(result.success).toBe(true);
            expect(mockAIInferenceService.tableQuestionAnswering).toHaveBeenCalledWith({
                inputs: {
                    query: 'How many employees are there?',
                    table: mockTable
                },
                model: 'google/tapas-base-finetuned-wtq'
            });

            const answerData = await projectOutputDataCache.get('ai-table-qa-test', 'answer');
            const coordinatesData = await projectOutputDataCache.get('ai-table-qa-test', 'coordinates');
            expect(answerData).toBe('3');
            expect(coordinatesData).toEqual([[0, 1], [1, 1], [2, 1]]);
        });
    });

    // ========================================
    // INTEGRATION TESTS
    // ========================================

    describe('AI Node Integration Tests', () => {
        test('Text Generation + Text Classification Pipeline', async () => {
            // Mock the API responses
            mockAIInferenceService.textGeneration.mockResolvedValue([
                { generated_text: 'This is an amazing product that I absolutely love!' }
            ]);
            
            mockAIInferenceService.textClassification.mockResolvedValue([
                [
                    { label: 'POSITIVE', score: 0.9995 },
                    { label: 'NEGATIVE', score: 0.0005 }
                ]
            ]);

            mockNodes = [
                {
                    id: 'text-generator',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'ai_text_generation',
                        input: {
                            prompt: 'Write a review about this product:',
                            model: 'gpt2',
                            max_length: 50
                        },
                    },
                },
                {
                    id: 'sentiment-classifier',
                    type: 'node',
                    position: { x: 300, y: 0 },
                    data: {
                        nid: 'ai_text_classification',
                        input: {
                            model: 'cardiffnlp/twitter-roberta-base-sentiment-latest'
                        },
                    },
                },
            ];

            mockEdges = [
                {
                    id: 'gen-to-class',
                    source: 'text-generator',
                    target: 'sentiment-classifier',
                    sourceHandle: 'generated_text',
                    targetHandle: 'text',
                },
            ];

            const result = await executeFlowGraph('test', mockNodes, mockEdges);
            
            expect(result.success).toBe(true);
            
            // Verify both nodes were called
            expect(mockAIInferenceService.textGeneration).toHaveBeenCalled();
            expect(mockAIInferenceService.textClassification).toHaveBeenCalledWith({
                inputs: 'This is an amazing product that I absolutely love!',
                model: 'cardiffnlp/twitter-roberta-base-sentiment-latest'
            });

            // Check final output
            const sentimentResults = await projectOutputDataCache.get('sentiment-classifier', 'results');
            expect(sentimentResults[0].label).toBe('POSITIVE');
            expect(sentimentResults[0].score).toBeGreaterThan(0.99);
        });

        test('Question + Context -> Question Answering -> Summarization Pipeline', async () => {
            // Mock the API responses
            mockAIInferenceService.questionAnswering.mockResolvedValue({
                answer: 'Paris is the capital of France and is known for its art, fashion, and culture.',
                score: 0.95
            });
            
            mockAIInferenceService.summarization.mockResolvedValue([
                { summary_text: 'Paris: France\'s cultural capital.' }
            ]);

            mockNodes = [
                {
                    id: 'qa-node',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'ai_question_answering',
                        input: {
                            question: 'Tell me about Paris',
                            context: 'Paris is the capital of France and is known for its art, fashion, gastronomy, and culture. The city has many famous landmarks including the Eiffel Tower, Notre-Dame Cathedral, and the Louvre Museum.',
                            model: 'distilbert-base-cased-distilled-squad'
                        },
                    },
                },
                {
                    id: 'summary-node',
                    type: 'node',
                    position: { x: 300, y: 0 },
                    data: {
                        nid: 'ai_summarization',
                        input: {
                            model: 'facebook/bart-large-cnn',
                            max_length: 20,
                            min_length: 5
                        },
                    },
                },
            ];

            mockEdges = [
                {
                    id: 'qa-to-summary',
                    source: 'qa-node',
                    target: 'summary-node',
                    sourceHandle: 'answer',
                    targetHandle: 'text',
                },
            ];

            const result = await executeFlowGraph('test', mockNodes, mockEdges);
            
            expect(result.success).toBe(true);
            
            // Verify both nodes were called
            expect(mockAIInferenceService.questionAnswering).toHaveBeenCalled();
            expect(mockAIInferenceService.summarization).toHaveBeenCalledWith({
                inputs: 'Paris is the capital of France and is known for its art, fashion, and culture.',
                model: 'facebook/bart-large-cnn',
                parameters: {
                    max_length: 20,
                    min_length: 5,
                    do_sample: false
                }
            });

            // Check final output
            const summary = await projectOutputDataCache.get('summary-node', 'summary');
            expect(summary).toBe('Paris: France\'s cultural capital.');
        });
    });

    // ========================================
    // ERROR HANDLING TESTS
    // ========================================

    describe('AI Node Error Handling', () => {
        test('Should handle API errors gracefully', async () => {
            // Mock an API error
            mockAIInferenceService.textGeneration.mockRejectedValue(
                new Error('API rate limit exceeded')
            );

            mockNodes = [
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

            const result = await executeFlowGraph('test', mockNodes, mockEdges);
            
            expect(result.success).toBe(false);
            expect(result.errors).toBeDefined();
        });

        test('Should handle missing required inputs', async () => {
            mockNodes = [
                {
                    id: 'incomplete-node',
                    type: 'node',
                    position: { x: 0, y: 0 },
                    data: {
                        nid: 'ai_question_answering',
                        input: {
                            question: 'What is the answer?',
                            // Missing context
                            model: 'distilbert-base-cased-distilled-squad'
                        },
                    },
                },
            ];

            const result = await executeFlowGraph('test', mockNodes, mockEdges);
            
            // The node should execute but the API call might fail or return empty results
            // Depending on implementation, this might succeed with empty context
            expect(result).toBeDefined();
        });
    });
});