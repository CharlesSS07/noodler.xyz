import type { User } from 'firebase/auth';
import type { Jimp, JimpInstance } from 'jimp';

// Base interfaces for all AI requests and responses
export interface AIInferenceRequest {
    model?: string;
    parameters?: Record<string, any>;
}

export interface AIInferenceResponse<T = any> {
    data: T;
    status: number;
}

// Text-to-Image specific interfaces
export interface TextToImageRequest extends AIInferenceRequest {
    inputs: string; // text prompt
    parameters?: {
        num_inference_steps?: number;
        guidance_scale?: number;
        negative_prompt?: string;
        height?: number;
        width?: number;
    };
}

export interface TextToImageResponse {
    image: string; // base64 data URL
    metadata: {
        model: string;
        prompt: string;
        parameters: Record<string, any>;
    };
}

// Image Processing interfaces
export interface ImageClassificationRequest extends AIInferenceRequest {
    inputs: JimpInstance | string; // JIMP image or base64 string
    parameters?: any;
}

export interface ClassificationResult {
    label: string;
    score: number;
}

export interface ObjectDetectionRequest extends AIInferenceRequest {
    inputs: JimpInstance | string; // JIMP image or base64 string
    parameters?: {
        threshold?: number;
    };
}

export interface DetectionResult {
    score: number;
    label: string;
    box: {
        xmin: number;
        ymin: number;
        xmax: number;
        ymax: number;
    };
}

export interface AutomaticSpeechRecognitionRequest extends AIInferenceRequest {
    inputs: string; // base64 audio data
    parameters?: any;
}

export interface SpeechRecognitionResult {
    text: string;
}

export interface TableQuestionAnsweringRequest extends AIInferenceRequest {
    inputs: {
        query: string;
        table: Record<string, string[]>;
    };
    parameters?: any;
}

export interface TableQAResult {
    answer: string;
    coordinates: number[][];
    cells: string[];
    aggregator: string;
}

// Text Processing interfaces
export interface TextGenerationRequest extends AIInferenceRequest {
    inputs: string;
    parameters?: {
        max_length?: number;
        temperature?: number;
        do_sample?: boolean;
        top_k?: number;
        top_p?: number;
    };
}

export interface TextClassificationRequest extends AIInferenceRequest {
    inputs: string;
    parameters?: any;
}

export interface TokenClassificationRequest extends AIInferenceRequest {
    inputs: string;
    parameters?: {
        aggregation_strategy?: 'simple' | 'first' | 'average' | 'max';
    };
}

export interface QuestionAnsweringRequest extends AIInferenceRequest {
    inputs: {
        question: string;
        context: string;
    };
    parameters?: any;
}

export interface QuestionAnsweringResult {
    answer: string;
    score: number;
    start: number;
    end: number;
}

export interface FillMaskRequest extends AIInferenceRequest {
    inputs: string;
    parameters?: {
        top_k?: number;
    };
}

export interface SummarizationRequest extends AIInferenceRequest {
    inputs: string;
    parameters?: {
        max_length?: number;
        min_length?: number;
        do_sample?: boolean;
    };
}

export interface TranslationRequest extends AIInferenceRequest {
    inputs: string;
    parameters?: any;
}

export interface SentenceSimilarityRequest extends AIInferenceRequest {
    inputs: {
        source_sentence: string;
        sentences: string[];
    };
    parameters?: any;
}

export interface ConversationalRequest extends AIInferenceRequest {
    inputs: {
        past_user_inputs?: string[];
        generated_responses?: string[];
        text: string;
    };
    parameters?: {
        max_length?: number;
        temperature?: number;
    };
}

export interface FeatureExtractionRequest extends AIInferenceRequest {
    inputs: string | string[];
    parameters?: any;
}

// Service configuration
export interface AIInferenceServiceConfig {
    user: User;
    functionUrl?: string; // Optional override for function URL
}

// Error types
export interface AIInferenceError extends Error {
    status?: number;
    response?: any;
}
