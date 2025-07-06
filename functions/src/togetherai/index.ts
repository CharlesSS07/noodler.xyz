import {onCall, HttpsError} from "firebase-functions/v2/https";
import {textToImage as textToImageCore} from "./images";
import config from "../config";

const allowedOrigins = config.domains.flatMap((domain) => [
  `https://${domain}`,
  `http://${domain}`,
]);

if (process.env.FUNCTIONS_EMULATOR) {
  allowedOrigins.push("http://localhost:5173");
}

export const textToImage = onCall({cors: allowedOrigins}, async (request) => {
  const {
    model,
    prompt,
    negative_prompt: negativePrompt,
    guidance,
    height,
    width,
    seed,
    steps,
  } = request.data;

  try {
    return await textToImageCore({
      model,
      prompt,
      negative_prompt: negativePrompt,
      guidance,
      height,
      width,
      seed,
      steps,
    });
  } catch (error) {
    // Convert regular errors to HttpsError to preserve error messages
    if (error instanceof Error) {
      throw new HttpsError("invalid-argument", error.message);
    }
    throw error;
  }
});
