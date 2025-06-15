import type { User } from 'firebase/auth';
import {Jimp, type JimpInstance, JimpMime} from 'jimp';
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
  FeatureExtractionRequest
} from './AIInferenceTypes';
import {auth} from "../../firebase";

export class AIInferenceService {
  private user: User;
  private baseUrl: string;

  constructor(config: AIInferenceServiceConfig) {
    this.user = config.user;
    // Default to Firebase Functions URL - update this with your actual project URL
    this.baseUrl = config.functionUrl || 'https://us-central1-chuck-65c6e.cloudfunctions.net';
  }

  // Utility methods for JIMP conversion
  private async jimpToBase64(image: JimpInstance): Promise<string> {
    const buffer = await image.getBuffer(JimpMime.png);
    const base64 = buffer.toString('base64');
    return `data:image/png;base64,${base64}`;
  }

  private async base64ToJimp(base64String: string): Promise<JimpInstance> {
    // Remove data URL prefix if present
    const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    // @ts-ignore
    return await Jimp.read(buffer);
  }

  private async makeRequest<T>(endpoint: string, data: any): Promise<T> {
    const idToken = await this.user.getIdToken();
    
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      const aiError: AIInferenceError = new Error(error.error || 'Request failed');
      aiError.status = response.status;
      aiError.response = error;
      throw aiError;
    }

    return await response.json();
  }

  // Text-to-Image Generation
  async textToImage(request: TextToImageRequest): Promise<JimpInstance> {
    const response = await this.makeRequest<TextToImageResponse>('textToImage', request);
    return await this.base64ToJimp(response.image);
  }

  // Image Processing Endpoints
  async imageClassification(request: ImageClassificationRequest): Promise<ClassificationResult[]> {
    const processedRequest = {
      ...request,
      inputs: request.inputs instanceof Jimp ? await this.jimpToBase64(request.inputs) : request.inputs
    };
    
    return await this.makeRequest<ClassificationResult[]>('imageClassification', processedRequest);
  }

  async objectDetection(request: ObjectDetectionRequest): Promise<DetectionResult[]> {
    const processedRequest = {
      ...request,
      inputs: request.inputs instanceof Jimp ? await this.jimpToBase64(request.inputs) : request.inputs
    };
    
    return await this.makeRequest<DetectionResult[]>('objectDetection', processedRequest);
  }

  async automaticSpeechRecognition(request: AutomaticSpeechRecognitionRequest): Promise<SpeechRecognitionResult> {
    return await this.makeRequest<SpeechRecognitionResult>('automaticSpeechRecognition', request);
  }

  async tableQuestionAnswering(request: TableQuestionAnsweringRequest): Promise<TableQAResult> {
    return await this.makeRequest<TableQAResult>('tableQuestionAnswering', request);
  }

  // Text Processing Endpoints
  async textGeneration(request: TextGenerationRequest): Promise<{ generated_text: string }[]> {
    return await this.makeRequest<{ generated_text: string }[]>('textGeneration', request);
  }

  async textClassification(request: TextClassificationRequest): Promise<ClassificationResult[][]> {
    return await this.makeRequest<ClassificationResult[][]>('textClassification', request);
  }

  async tokenClassification(request: TokenClassificationRequest): Promise<any[]> {
    return await this.makeRequest<any[]>('tokenClassification', request);
  }

  async questionAnswering(request: QuestionAnsweringRequest): Promise<QuestionAnsweringResult> {
    return await this.makeRequest<QuestionAnsweringResult>('questionAnswering', request);
  }

  async fillMask(request: FillMaskRequest): Promise<any[]> {
    return await this.makeRequest<any[]>('fillMask', request);
  }

  async summarization(request: SummarizationRequest): Promise<{ summary_text: string }[]> {
    return await this.makeRequest<{ summary_text: string }[]>('summarization', request);
  }

  async translation(request: TranslationRequest): Promise<{ translation_text: string }[]> {
    return await this.makeRequest<{ translation_text: string }[]>('translation', request);
  }

  async sentenceSimilarity(request: SentenceSimilarityRequest): Promise<number[]> {
    return await this.makeRequest<number[]>('sentenceSimilarity', request);
  }

  async conversational(request: ConversationalRequest): Promise<{ generated_text: string }> {
    return await this.makeRequest<{ generated_text: string }>('conversational', request);
  }

  async featureExtraction(request: FeatureExtractionRequest): Promise<number[][]> {
    return await this.makeRequest<number[][]>('featureExtraction', request);
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
