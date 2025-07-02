import * as admin from "firebase-admin";

admin.initializeApp();

// Genkit-based Content Summarization Flow
export {summarizeContent} from "./genkitFlows/summarizationFlow";

// Genkit-based LLM Flow
export {callLLM} from "./genkitFlows/llmFlow";

// Genkit-based Text Formatting LLM Flow
export {textFormatingLLM} from "./genkitFlows/textFormatingLLMFlow";

// Health Check Functions
export {
  publicHealthCheck,
  authenticatedHealthCheck,
  verifiedEmailHealthCheck,
} from "./healthchecks";

// NodeBlueprint Functions
export {
  embedNodeBluePrint,
  embedAllUnembeddedNodeBluePrints,
  searchNodeBluePrints,
} from "./nodeBlueprints";

