// import the Genkit and Google AI plugin libraries
import {gemini15Flash, googleAI} from "@genkit-ai/googleai";
import {genkit, z} from "genkit";

// configure a Genkit instance
const ai = genkit({
  plugins: [googleAI()],
  model: gemini15Flash, // set default model
});

const helloFlow = ai.defineFlow("helloFlow", async (name) => {
  // make a generation request
  const {text} = await ai.generate(`Hello Gemini, my name is ${name}`);
  console.log(text);
});

helloFlow("Chris");

// specifically for genkit in firebase functions! IMPORTANT!!
// notes from here: https://genkit.dev/docs/firebase/

// this is a flow. use them when possible.
const generatePoemFlow = ai.defineFlow(
  {
    name: "generatePoem",
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (subject: string) => {
    const {text} = await ai.generate(`Compose a poem about ${subject}.`);
    return text;
  },
);


// always wrap the flows in this!
import {onCall} from "firebase-functions/https";
// export const generatePoem = onCallGenkit(generatePoemFlow);


// this makes sure a flow is only callable by specific people
export const generatePoem = onCall(
  {
    // No specific options needed for basic auth check
  },
  async (request) => {
    // Check if user is logged in and has verified email
    if (!request.auth?.token?.email_verified) {
      throw new Error("Authentication required with verified email");
    }
    return await generatePoemFlow(request.data);
  }
);
