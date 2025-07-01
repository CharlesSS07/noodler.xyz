import type { User } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { Jimp, type JimpInstance, JimpMime } from 'jimp';
import { auth, functions } from '../../firebase';
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

export class AIInferenceService {
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

    private async callFirebaseFunction<T>(
        functionName: string,
        data: any
    ): Promise<T> {
        try {
            console.log(
                `Calling Firebase function: ${functionName}`,
                JSON.stringify(data)
            );

            const callable = httpsCallable(functions, functionName);
            const result = await callable(data);

            console.log(
                `Firebase function ${functionName} response:`,
                result.data
            );

            return result.data as T;
        } catch (error: any) {
            console.error(`Firebase function ${functionName} error:`, error);

            const aiError: AIInferenceError = new Error(
                error.message || `Function ${functionName} failed`
            );
            aiError.status = error.code || 'unknown';
            aiError.response = error.details || error;
            throw aiError;
        }
    }

    // Text-to-Image Generation
    async textToImage(request: TextToImageRequest): Promise<JimpInstance> {
        const response = await this.callFirebaseFunction<TextToImageResponse>(
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

        return await this.callFirebaseFunction<ClassificationResult[]>(
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

        return await this.callFirebaseFunction<DetectionResult[]>(
            'objectDetection',
            processedRequest
        );
    }

    async automaticSpeechRecognition(
        request: AutomaticSpeechRecognitionRequest
    ): Promise<SpeechRecognitionResult> {
        return await this.callFirebaseFunction<SpeechRecognitionResult>(
            'automaticSpeechRecognition',
            request
        );
    }

    async tableQuestionAnswering(
        request: TableQuestionAnsweringRequest
    ): Promise<TableQAResult> {
        return await this.callFirebaseFunction<TableQAResult>(
            'tableQuestionAnswering',
            request
        );
    }

    async textClassification(
        request: TextClassificationRequest
    ): Promise<ClassificationResult[][]> {
        return await this.callFirebaseFunction<ClassificationResult[][]>(
            'textClassification',
            request
        );
    }

    async tokenClassification(
        request: TokenClassificationRequest
    ): Promise<any[]> {
        return await this.callFirebaseFunction<any[]>(
            'tokenClassification',
            request
        );
    }

    async questionAnswering(
        request: QuestionAnsweringRequest
    ): Promise<QuestionAnsweringResult> {
        return await this.callFirebaseFunction<QuestionAnsweringResult>(
            'questionAnswering',
            request
        );
    }

    async fillMask(request: FillMaskRequest): Promise<any[]> {
        return await this.callFirebaseFunction<any[]>('fillMask', request);
    }

    async translation(
        request: TranslationRequest
    ): Promise<{ translation_text: string }[]> {
        return await this.callFirebaseFunction<{ translation_text: string }[]>(
            'translation',
            request
        );
    }

    async sentenceSimilarity(
        request: SentenceSimilarityRequest
    ): Promise<number[]> {
        return await this.callFirebaseFunction<number[]>(
            'sentenceSimilarity',
            request
        );
    }

    async conversational(
        request: ConversationalRequest
    ): Promise<{ generated_text: string }> {
        return await this.callFirebaseFunction<{ generated_text: string }>(
            'conversational',
            request
        );
    }

    async featureExtraction(
        request: FeatureExtractionRequest
    ): Promise<number[][]> {
        return await this.callFirebaseFunction<number[][]>(
            'featureExtraction',
            request
        );
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
        // Use callable function for Genkit-based functions
        const response = await this.callFirebaseFunction<{
            summary: string;
            originalLength: number;
            summaryLength: number;
            compressionRatio: number;
        }>('summarizeContent', request);

        return response;
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
        // Use callable function for Genkit-based functions
        const response = await this.callFirebaseFunction<{
            response: string;
            promptLength: number;
            responseLength: number;
        }>('callLLM', request);

        return response;
    }

    async formatText(
        request: TextFormattingRequest
    ): Promise<TextFormattingResponse> {
        // Use callable function for Genkit-based functions
        const response =
            await this.callFirebaseFunction<TextFormattingResponse>(
                'textFormatingLLM',
                request
            );

        return response;
    }
}

export const aiServiceInstance: AIInferenceService = new AIInferenceService();
