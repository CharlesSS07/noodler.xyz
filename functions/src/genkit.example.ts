// import the Genkit and Google AI plugin libraries
import { gemini15Flash, googleAI } from '@genkit-ai/googleai';
import { genkit, z } from 'genkit';

// configure a Genkit instance
const ai = genkit({
    plugins: [googleAI()],
    model: gemini15Flash, // set default model
});

const helloFlow = ai.defineFlow('helloFlow', async (name) => {
    // make a generation request
    const { text } = await ai.generate(`Hello Gemini, my name is ${name}`);
    console.log(text);
});

helloFlow('Chris');

// specifically for genkit in firebase functions! IMPORTANT!!
// notes from here: https://genkit.dev/docs/firebase/

const generatePoemFlow = ai.defineFlow( // this is a flow. use them when possible.
    {
        name: 'generatePoem',
        inputSchema: z.string(),
        outputSchema: z.string(),
    },
    async (subject: string) => {
        const { text } = await ai.generate(`Compose a poem about ${subject}.`);
        return text;
    },
);


import { onCallGenkit } from 'firebase-functions/https'; // always wrap the flows in this!
// export const generatePoem = onCallGenkit(generatePoemFlow);


// this makes sure a flow is only callable by specific people
export const generatePoem = onCallGenkit(
    {
        authPolicy: (auth) => auth?.token?.email_verified,
    }, // make sure they are logged in, and have a verified email.
    generatePoemFlow,
);