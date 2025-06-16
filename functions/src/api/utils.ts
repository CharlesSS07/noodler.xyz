import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {InferenceClient} from "@huggingface/inference";
import {HuggingFaceResponse} from "./types";

const HF_TOKEN =
    functions.config().huggingface?.token || process.env.HUGGINGFACE_TOKEN;

// Only warn about token if we're actually trying to use it
if (!HF_TOKEN) {
  console.warn(
    "HuggingFace token not configured. Set HUGGINGFACE_TOKEN " +
      "environment variable or use firebase functions:config:set " +
      "huggingface.token=\"your-token\""
  );
}


// Initialize HuggingFace client
let hfClient: InferenceClient | null = null;

export const getHFClient = (): InferenceClient => {
  if (!HF_TOKEN) {
    console.error("HuggingFace token not configured");
    throw new Error("HuggingFace token not configured");
  }
  if (!hfClient) {
    try {
      hfClient = new InferenceClient(HF_TOKEN);
    } catch (error) {
      console.error("Failed to initialize HuggingFace client:", error);
      throw error;
    }
  }
  return hfClient;
};


// Generic helper for HuggingFace API responses
export const wrapHFResponse = async <T>(
  hfCall: Promise<T>
): Promise<HuggingFaceResponse> => {
  try {
    const data = await hfCall;
    return {
      data,
      status: 200,
    };
  } catch (error: any) {
    throw new Error(error.message || "HuggingFace API Error");
  }
};

export const authenticateRequest = async (req: any): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header");
  }
  const idToken = authHeader.split("Bearer ")[1];
  await admin.auth().verifyIdToken(idToken);
};

export const getDefaultModel = (task: string): string => {
  const defaults: Record<string, string> = {
    "text-generation": "microsoft/DialoGPT-medium",
    "text-classification":
            "cardiffnlp/twitter-roberta-base-sentiment-latest",
    "token-classification":
            "dbmdz/bert-large-cased-finetuned-conll03-english",
    "question-answering": "deepset/roberta-base-squad2",
    "fill-mask": "google-bert/bert-base-uncased",
    "summarization": "facebook/bart-large-cnn",
    "translation": "Helsinki-NLP/opus-mt-en-fr",
    "sentence-similarity": "sentence-transformers/all-MiniLM-L6-v2",
    "conversational": "microsoft/DialoGPT-medium",
    "feature-extraction": "intfloat/multilingual-e5-large-instruct",
    "image-classification": "google/vit-base-patch16-224",
    "object-detection": "facebook/detr-resnet-50",
    "automatic-speech-recognition": "openai/whisper-large-v3",
    "table-question-answering": "google/tapas-base-finetuned-wtq",
    "text-to-image": "black-forest-labs/FLUX.1-dev",
  };
  return defaults[task] || "gpt2";
};

export const setCorsHeaders = (res: any, req?: any): void => {
  const allowedOrigins = ["https://noodeler.xyz", "http://localhost:5173"];
  const origin = req?.headers?.origin;

  if (allowedOrigins.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
  } else {
    res.set("Access-Control-Allow-Origin", "https://noodeler.xyz");
  }
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
};

export const handleError = (res: any, error: any, context: string,
  req?: any): void => {
  setCorsHeaders(res, req);
  console.error(`${context} Error:`, error.message);
  res.status(error.response?.status || 500).json({
    error: error.message || "Internal Server Error",
  });
};

export const validateInput = (
  res: any,
  condition: boolean,
  message: string,
  req?: any
): boolean => {
  if (!condition) {
    setCorsHeaders(res, req);
    res.status(400).json({error: message});
    return false;
  }
  return true;
};
