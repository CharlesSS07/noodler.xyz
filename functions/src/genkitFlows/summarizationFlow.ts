// Content Summarization Flow using Genkit
import {gemini15Flash, googleAI} from "@genkit-ai/googleai";
import {genkit, z} from "genkit";

import {onCall, HttpsError} from "firebase-functions/v2/https";
// import config from "../config";
// import {defineSecret} from "firebase-functions/params";
// const googleAIapiKey = defineSecret("GEMINI_API_KEY");

// Configure Genkit instance
const ai = genkit({
  plugins: [googleAI()], // Will use GOOGLE_GENAI_API_KEY env var
  model: gemini15Flash, // set default model
});

// Input schema for summarization
const SummarizationInput = z.object({
  content: z.string().min(1, "Content cannot be empty"),
  maxLength: z.number().optional().default(150),
  style: z.enum(["brief", "detailed", "bullet-points"])
    .optional().default("brief"),
});

// Output schema for summarization
const SummarizationOutput = z.object({
  summary: z.string(),
  originalLength: z.number(),
  summaryLength: z.number(),
  compressionRatio: z.number(),
});

// Define the content summarization flow
export const contentSummarizationFlow = ai.defineFlow(
  {
    name: "contentSummarization",
    inputSchema: SummarizationInput,
    outputSchema: SummarizationOutput,
  },
  async (input) => {
    const {content, maxLength = 150, style = "brief"} = input;

    // Create prompt based on style preference
    let prompt = "";
    switch (style) {
    case "brief":
      prompt = "Provide a brief summary of the following content in " +
        `approximately ${maxLength} words or less:\n\n${content}`;
      break;
    case "detailed":
      prompt = "Provide a detailed summary of the following content, " +
        "capturing key points and important details in approximately " +
        `${maxLength} words:\n\n${content}`;
      break;
    case "bullet-points":
      prompt = "Summarize the following content as bullet points, " +
        `highlighting the main ideas:\n\n${content}`;
      break;
    }

    // Generate summary using Gemini
    const {text} = await ai.generate(prompt);

    // Calculate metrics
    const originalLength = content.length;
    const summaryLength = text.length;
    const compressionRatio = Math.round(
      (summaryLength / originalLength) * 100
    ) / 100;

    return {
      summary: text,
      originalLength,
      summaryLength,
      compressionRatio,
    };
  }
);

// Export the function wrapped with onCallGenkit for Firebase Functions
export const summarizeContent = onCall(
  async (request) => {
    // Check authentication
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Authentication required");
    }

    try {
      return await contentSummarizationFlow(request.data);
    } catch (error) {
      // Convert regular errors to HttpsError to preserve error messages
      if (error instanceof Error) {
        throw new HttpsError("invalid-argument", error.message);
      }
      throw error;
    }
  }
);
