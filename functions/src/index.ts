import * as admin from "firebase-admin";

admin.initializeApp();

// Text Processing Endpoints
export {
  textGeneration,
  textClassification,
  tokenClassification,
  questionAnswering,
  fillMask,
  summarization,
  translation,
  sentenceSimilarity,
  conversational,
  featureExtraction,
} from "./api/textProcessing";

// Media Processing Endpoints
export {
  imageClassification,
  objectDetection,
  automaticSpeechRecognition,
  tableQuestionAnswering,
  textToImage,
} from "./api/mediaProcessing";
