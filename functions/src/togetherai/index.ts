import {onCall} from "firebase-functions/v2/https";
import {textToImage as textToImageCore} from "./images";

export const textToImage = onCall(async (request) => {
  const {model, prompt, negative_prompt, guidance, height, width, seed, steps} = request.data;
  
  return await textToImageCore({
    model,
    prompt,
    negative_prompt,
    guidance,
    height,
    width,
    seed,
    steps
  });
});