export interface HuggingFaceRequest {
  inputs: any;
  parameters?: any;
  options?: {
    wait_for_model?: boolean;
    use_cache?: boolean;
  };
}

export interface HuggingFaceResponse {
  data: any;
  status: number;
}

export interface ApiError {
  error: string;
  status?: number;
}

export interface TextGenerationRequest {
  inputs: string;
  model?: string;
  parameters?: {
    max_length?: number;
    temperature?: number;
    do_sample?: boolean;
    top_k?: number;
    top_p?: number;
  };
}

export interface TextClassificationRequest {
  inputs: string;
  model?: string;
  parameters?: any;
}

export interface TokenClassificationRequest {
  inputs: string;
  model?: string;
  parameters?: {
    aggregation_strategy?: 'simple' | 'first' | 'average' | 'max';
  };
}

export interface QuestionAnsweringRequest {
  inputs: {
    question: string;
    context: string;
  };
  model?: string;
  parameters?: any;
}

export interface FillMaskRequest {
  inputs: string;
  model?: string;
  parameters?: {
    top_k?: number;
  };
}

export interface SummarizationRequest {
  inputs: string;
  model?: string;
  parameters?: {
    max_length?: number;
    min_length?: number;
    do_sample?: boolean;
  };
}

export interface TranslationRequest {
  inputs: string;
  model?: string;
  parameters?: any;
}

export interface SentenceSimilarityRequest {
  inputs: {
    source_sentence: string;
    sentences: string[];
  };
  model?: string;
  parameters?: any;
}

export interface ConversationalRequest {
  inputs: {
    past_user_inputs?: string[];
    generated_responses?: string[];
    text: string;
  };
  model?: string;
  parameters?: {
    max_length?: number;
    temperature?: number;
  };
}

export interface FeatureExtractionRequest {
  inputs: string | string[];
  model?: string;
  parameters?: any;
}

export interface ImageClassificationRequest {
  inputs: string; // base64 image or image URL
  model?: string;
  parameters?: any;
}

export interface ObjectDetectionRequest {
  inputs: string; // base64 image or image URL
  model?: string;
  parameters?: {
    threshold?: number;
  };
}

export interface AutomaticSpeechRecognitionRequest {
  inputs: string; // base64 audio data
  model?: string;
  parameters?: any;
}

export interface TableQuestionAnsweringRequest {
  inputs: {
    query: string;
    table: Record<string, string[]>;
  };
  model?: string;
  parameters?: any;
}

export interface TextToImageRequest {
  inputs: string; // text prompt
  model?: string;
  parameters?: {
    num_inference_steps?: number;
    guidance_scale?: number;
    negative_prompt?: string;
    height?: number;
    width?: number;
  };
}