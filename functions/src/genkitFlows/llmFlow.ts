// LLM API Flow using Genkit
import {gemini15Flash, googleAI} from "@genkit-ai/googleai";
import {genkit, z} from "genkit";

import {onCallGenkit} from "firebase-functions/https";

// Configure Genkit instance
const ai = genkit({
  plugins: [googleAI()], // Will use GOOGLE_GENAI_API_KEY env var
  model: gemini15Flash, // set default model
});


// Input schema for LLM
const LLMInput = z.object({
  prompt: z.string().min(1, "Prompt cannot be empty"),
  maxTokens: z.number().optional().default(1024),
  temperature: z.number().min(0).max(2).optional().default(0.7),
});

// Output schema for LLM
const LLMOutput = z.object({
  response: z.string(),
  promptLength: z.number(),
  responseLength: z.number(),
});

// Define the LLM flow
export const llmFlow = ai.defineFlow(
  {
    name: "llm",
    inputSchema: LLMInput,
    outputSchema: LLMOutput,
  },
  async (input) => {
    const {prompt, maxTokens = 1024, temperature = 0.7} = input;

    // Generate response using Gemini
    const {text} = await ai.generate({
      prompt,
      config: {
        maxOutputTokens: maxTokens,
        temperature,
      },
    });

    // Calculate metrics
    const promptLength = prompt.length;
    const responseLength = text.length;

    return {
      response: text,
      promptLength,
      responseLength,
    };
  }
);

// Export the function wrapped with onCallGenkit for Firebase Functions
export const callLLM = onCallGenkit(
  {
    // authPolicy: (auth) => auth?.token?.email_verified,
    authPolicy: (auth) => {
      // Allow authenticated users (including anonymous) for testing
      return !!auth?.uid;
    },
  },
  llmFlow
);
