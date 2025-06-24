import * as admin from "firebase-admin";

admin.initializeApp();

// Genkit-based Content Summarization Flow
export { summarizeContent } from "./genkitFlows/summarizationFlow";
