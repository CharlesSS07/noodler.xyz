import {config} from "dotenv";

// Load environment variables from .env file
config();

import {InferenceClient} from "@huggingface/inference";

const client = new InferenceClient(process.env.HUGGINGFACE_TOKEN);

// not working; text generation on huggingface is lame
// // text generation
// client.textGeneration({
//     model: "gpt2",
//     inputs: "\"Can you please let us know more details about your \"",
// }).then( textCompletion => {
//     console.log(textCompletion.generated_text);
// });

// chat completion
client.chatCompletion({
    model: "google/gemma-2-2b-it",
    messages: [
        {
            role: "user",
            content: "What is the capital of France?",
        },
    ],
}).then( chatCompletion => {
    console.log(chatCompletion.choices[0].message);
});
