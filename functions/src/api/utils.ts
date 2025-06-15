import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { InferenceClient } from '@huggingface/inference';
import { HuggingFaceResponse } from './types';

const HF_TOKEN = functions.config().huggingface?.token || process.env.HUGGINGFACE_TOKEN;

if (!HF_TOKEN) {
  console.warn('HuggingFace token not configured. Set HUGGINGFACE_TOKEN environment variable or use firebase functions:config:set huggingface.token="your-token"');
}

// Initialize HuggingFace client
let hfClient: InferenceClient | null = null;

export const getHFClient = (): InferenceClient => {
  if (!HF_TOKEN) {
    throw new Error('HuggingFace token not configured');
  }
  if (!hfClient) {
    hfClient = new InferenceClient(HF_TOKEN);
  }
  return hfClient;
};

// Generic helper for HuggingFace API responses
export const wrapHFResponse = async <T>(hfCall: Promise<T>): Promise<HuggingFaceResponse> => {
  try {
    const data = await hfCall;
    return {
      data,
      status: 200
    };
  } catch (error: any) {
    throw {
      response: {
        status: error.status || 500,
        data: error.message || 'HuggingFace API Error'
      },
      message: error.message || 'HuggingFace API Error'
    };
  }
};

export const authenticateRequest = async (req: any): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }
  const idToken = authHeader.split('Bearer ')[1];
  await admin.auth().verifyIdToken(idToken);
};

export const getDefaultModel = (task: string): string => {
  const defaults: Record<string, string> = {
    'text-generation': 'microsoft/DialoGPT-medium',
    'text-classification': 'cardiffnlp/twitter-roberta-base-sentiment-latest',
    'token-classification': 'dbmdz/bert-large-cased-finetuned-conll03-english',
    'question-answering': 'deepset/roberta-base-squad2',
    'fill-mask': 'google-bert/bert-base-uncased',
    'summarization': 'facebook/bart-large-cnn',
    'translation': 'Helsinki-NLP/opus-mt-en-fr',
    'sentence-similarity': 'sentence-transformers/all-MiniLM-L6-v2',
    'conversational': 'microsoft/DialoGPT-medium',
    'feature-extraction': 'intfloat/multilingual-e5-large-instruct',
    'image-classification': 'google/vit-base-patch16-224',
    'object-detection': 'facebook/detr-resnet-50',
    'automatic-speech-recognition': 'openai/whisper-large-v3',
    'table-question-answering': 'google/tapas-base-finetuned-wtq',
    'text-to-image': 'black-forest-labs/FLUX.1-dev'
  };
  return defaults[task] || 'gpt2';
};

export const handleError = (res: any, error: any, context: string): void => {
  console.error(`${context} Error:`, error.message);
  res.status(error.response?.status || 500).json({
    error: error.message || 'Internal Server Error'
  });
};

export const validateInput = (res: any, condition: boolean, message: string): boolean => {
  if (!condition) {
    res.status(400).json({ error: message });
    return false;
  }
  return true;
};