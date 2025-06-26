import type { User } from 'firebase/auth';
import { Jimp, type JimpInstance, JimpMime } from 'jimp';
import {auth, isUsingEmulators} from '../../firebase/index';
import type {
    AIInferenceServiceConfig,
    AIInferenceError,
    TextToImageRequest,
    TextToImageResponse,
    ImageClassificationRequest,
    ClassificationResult,
    ObjectDetectionRequest,
    DetectionResult,
    AutomaticSpeechRecognitionRequest,
    SpeechRecognitionResult,
    TableQuestionAnsweringRequest,
    TableQAResult,
    TextGenerationRequest,
    TextClassificationRequest,
    TokenClassificationRequest,
    QuestionAnsweringRequest,
    QuestionAnsweringResult,
    FillMaskRequest,
    SummarizationRequest,
    TranslationRequest,
    SentenceSimilarityRequest,
    ConversationalRequest,
    FeatureExtractionRequest,
    TextFormattingRequest,
    TextFormattingResponse,
} from './AIInferenceTypes';

export let aiServiceInstance: AIInferenceService | undefined;

auth.onAuthStateChanged((user) => {
    if (user) {
        aiServiceInstance = new AIInferenceService({user});
    }
})

export class AIInferenceService {
    private user: User;
    private baseUrl: string;

    constructor(config: AIInferenceServiceConfig) {
        this.user = config.user;
        // Use emulator URL when running locally, production URL otherwise
        if (config.functionUrl) {
            this.baseUrl = config.functionUrl;
        } else if (isUsingEmulators) {
            this.baseUrl = 'http://127.0.0.1:5001/chuck-65c6e/us-central1';
        } else {
            this.baseUrl = 'https://us-central1-chuck-65c6e.cloudfunctions.net';
        }
    }

    // Utility methods for JIMP conversion
    private async jimpToBase64(image: JimpInstance): Promise<string> {
        const buffer = await image.getBuffer(JimpMime.png);
        const base64 = buffer.toString('base64');
        return `data:image/png;base64,${base64}`;
    }

    private async base64ToJimp(base64String: string): Promise<JimpInstance> {
        // Remove data URL prefix if present
        const base64Data = base64String.replace(
            /^data:image\/[a-z]+;base64,/,
            ''
        );
        const buffer = Buffer.from(base64Data, 'base64');
        // @ts-ignore
        return await Jimp.read(buffer);
    }

    private async makeRequest<T>(endpoint: string, data: any): Promise<T> {
        const idToken = await this.user.getIdToken();

        console.log('ai inference service request data', JSON.stringify(data));

        const response = await fetch(`${this.baseUrl}/${endpoint}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${idToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('HTTP Error Response:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText
            });
            
            let error;
            try {
                error = JSON.parse(errorText);
            } catch {
                error = { error: errorText || 'Request failed' };
            }
            
            const errorMessage = error.error?.message || error.message || error.error || `HTTP ${response.status}: ${response.statusText}`;
            const aiError: AIInferenceError = new Error(errorMessage);
            aiError.status = response.status;
            aiError.response = error;
            throw aiError;
        }

        const ret = await response.json();

        console.log('ai inference service request data', ret);

        return ret;
    }

    // Text-to-Image Generation
    async textToImage(request: TextToImageRequest): Promise<JimpInstance> {
        const response = await this.makeRequest<TextToImageResponse>(
            'textToImage',
            request
        );
        return await this.base64ToJimp(response.image);
    }

    // Image Processing Endpoints
    async imageClassification(
        request: ImageClassificationRequest
    ): Promise<ClassificationResult[]> {
        const processedRequest = {
            ...request,
            inputs:
                request.inputs instanceof Jimp
                    ? await this.jimpToBase64(request.inputs)
                    : request.inputs,
        };

        return await this.makeRequest<ClassificationResult[]>(
            'imageClassification',
            processedRequest
        );
    }

    async objectDetection(
        request: ObjectDetectionRequest
    ): Promise<DetectionResult[]> {
        const processedRequest = {
            ...request,
            inputs:
                request.inputs instanceof Jimp
                    ? await this.jimpToBase64(request.inputs)
                    : request.inputs,
        };

        return await this.makeRequest<DetectionResult[]>(
            'objectDetection',
            processedRequest
        );
    }

    async automaticSpeechRecognition(
        request: AutomaticSpeechRecognitionRequest
    ): Promise<SpeechRecognitionResult> {
        return await this.makeRequest<SpeechRecognitionResult>(
            'automaticSpeechRecognition',
            request
        );
    }

    async tableQuestionAnswering(
        request: TableQuestionAnsweringRequest
    ): Promise<TableQAResult> {
        return await this.makeRequest<TableQAResult>(
            'tableQuestionAnswering',
            request
        );
    }

    async textClassification(
        request: TextClassificationRequest
    ): Promise<ClassificationResult[][]> {
        return await this.makeRequest<ClassificationResult[][]>(
            'textClassification',
            request
        );
    }

    async tokenClassification(
        request: TokenClassificationRequest
    ): Promise<any[]> {
        return await this.makeRequest<any[]>('tokenClassification', request);
    }

    async questionAnswering(
        request: QuestionAnsweringRequest
    ): Promise<QuestionAnsweringResult> {
        return await this.makeRequest<QuestionAnsweringResult>(
            'questionAnswering',
            request
        );
    }

    async fillMask(request: FillMaskRequest): Promise<any[]> {
        return await this.makeRequest<any[]>('fillMask', request);
    }

    async translation(
        request: TranslationRequest
    ): Promise<{ translation_text: string }[]> {
        return await this.makeRequest<{ translation_text: string }[]>(
            'translation',
            request
        );
    }

    async sentenceSimilarity(
        request: SentenceSimilarityRequest
    ): Promise<number[]> {
        return await this.makeRequest<number[]>('sentenceSimilarity', request);
    }

    async conversational(
        request: ConversationalRequest
    ): Promise<{ generated_text: string }> {
        return await this.makeRequest<{ generated_text: string }>(
            'conversational',
            request
        );
    }

    async featureExtraction(
        request: FeatureExtractionRequest
    ): Promise<number[][]> {
        return await this.makeRequest<number[][]>('featureExtraction', request);
    }

    // GenKit-based endpoints
    async summarize(request: {
        content: string;
        maxLength?: number;
        style?: 'brief' | 'detailed' | 'bullet-points';
    }): Promise<{
        summary: string;
        originalLength: number;
        summaryLength: number;
        compressionRatio: number;
    }> {
        // GenKit functions expect data to be wrapped in a 'data' field
        const response = await this.makeRequest<{
            result: {
                summary: string;
                originalLength: number;
                summaryLength: number;
                compressionRatio: number;
            }
        }>('summarizeContent', { data: request });
        
        // GenKit functions return data wrapped in a 'result' field
        return response.result;
    }

    async callLLM(request: {
        prompt: string;
        maxTokens?: number;
        temperature?: number;
    }): Promise<{
        response: string;
        promptLength: number;
        responseLength: number;
    }> {
        // GenKit functions expect data to be wrapped in a 'data' field
        const response = await this.makeRequest<{
            result: {
                response: string;
                promptLength: number;
                responseLength: number;
            }
        }>('callLLM', { data: request });
        
        // GenKit functions return data wrapped in a 'result' field
        return response.result;
    }

    async formatText(request: TextFormattingRequest): Promise<TextFormattingResponse> {
        // GenKit functions expect data to be wrapped in a 'data' field
        const response = await this.makeRequest<{
            result: TextFormattingResponse
        }>('textFormatingLLM', { data: request });
        
        // GenKit functions return data wrapped in a 'result' field
        return response.result;
    }

    // Configuration methods
    setBaseUrl(url: string): void {
        this.baseUrl = url;
    }

    getBaseUrl(): string {
        return this.baseUrl;
    }

    updateUser(user: User): void {
        this.user = user;
    }
}


