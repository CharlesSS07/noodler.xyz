import {gemini15Flash, googleAI} from "@genkit-ai/googleai";
import {genkit, z} from "genkit";
import {onCallGenkit} from "firebase-functions/https";

const ai = genkit({
  plugins: [googleAI()],
  model: gemini15Flash,
});

const InputSchema = z.object({
  text: z.string().min(1, "Input text is required"),
  formatRules: z.string().min(1, "Format rules are required"),
  outputType: z.enum(["plain", "markdown", "html", "json", "structured"])
    .optional().default("plain"),
  preserveContent: z.boolean().optional().default(true),
  maxOutputLength: z.number().min(10).max(10000).optional().default(2000),
});

const OutputSchema = z.object({
  formattedText: z.string(),
  originalLength: z.number(),
  formattedLength: z.number(),
  compressionRatio: z.number(),
  formatApplied: z.string(),
});

export const textFormatingLLMFlow = ai.defineFlow({
  name: "textFormatingLLM",
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
}, async (input) => {
  const {
    text,
    formatRules,
    outputType,
    preserveContent,
    maxOutputLength,
  } = input;

  const preserveInstruction = preserveContent ?
    "Preserve all important information and meaning from the original text." :
    "You may condense or omit less important information if needed.";

  const outputTypeInstruction = getOutputTypeInstruction(outputType);

  const prompt = "Please format the following text according to the " +
    `specified rules:

ORIGINAL TEXT:
${text}

FORMAT RULES:
${formatRules}

INSTRUCTIONS:
- ${preserveInstruction}
- ${outputTypeInstruction}
- Keep the output under ${maxOutputLength} characters
- Follow the format rules precisely
- Maintain readability and clarity

Please provide only the formatted text as your response.`;

  const response = await ai.generate({
    prompt,
    config: {
      maxOutputTokens: Math.ceil(maxOutputLength / 4), // Rough token estimation
      temperature: 0.3, // Lower temperature for more consistent formatting
    },
  });

  const formattedText = response.text;
  const originalLength = text.length;
  const formattedLength = formattedText.length;
  const compressionRatio = originalLength > 0 ?
    formattedLength / originalLength : 1;

  return {
    formattedText,
    originalLength,
    formattedLength,
    compressionRatio: Math.round(compressionRatio * 100) / 100,
    formatApplied: `${outputType} format with custom rules`,
  };
});

/**
 * Get output type instruction for text formatting
 * @param {string} outputType - The type of output format
 * @return {string} The instruction string
 */
function getOutputTypeInstruction(outputType: string): string {
  switch (outputType) {
  case "markdown":
    return "Format the output using proper Markdown syntax with " +
      "headers, lists, and emphasis where appropriate.";
  case "html":
    return "Format the output as clean HTML with appropriate tags " +
      "and structure.";
  case "json":
    return "Structure the output as valid JSON with meaningful " +
      "key-value pairs.";
  case "structured":
    return "Organize the output with clear sections, bullet points, " +
      "or numbered lists as appropriate.";
  default:
    return "Format as plain text with clear structure and " +
      "organization.";
  }
}

export const textFormatingLLM = onCallGenkit({
  authPolicy: (auth) => !!auth?.uid,
}, textFormatingLLMFlow);
