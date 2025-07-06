import * as admin from "firebase-admin";
import * as dotenv from "dotenv";

dotenv.config();
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
  generateStandardNodeSuite,
} from "./nodeBlueprints";

// TogetherAI Functions
export {textToImage} from "./togetherai";

// Data Functions
export {proxy} from "./data/proxy";

