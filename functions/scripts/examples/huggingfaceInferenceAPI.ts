// to claude: do not modify this file. they are my examples of how you can call huggingface models
// these work in the given functions environment:
// $ npx ts-node scripts/examples/huggingfaceInferenceAPI.ts

import {config} from "dotenv";

// Load environment variables from .env file
config();

import {InferenceClient} from "@huggingface/inference";

const client = new InferenceClient(process.env.HUGGINGFACE_TOKEN);

// not working; text generation on huggingface is lame. we will use another provider
// // text generation
// client.textGeneration({
//     model: "gpt2",
//     inputs: "\"Can you please let us know more details about your \"",
// }).then( textCompletion => {
//     console.log(textCompletion.generated_text);
// });

// chat completion // working
client.chatCompletion({
    model: "google/gemma-2-2b-it",
    messages: [
        {
            role: "user",
            content: "What is the capital of France?",
        },
    ],
}).then( chatCompletion => {
    console.log('chatCompletion', chatCompletion.choices[0].message);
});


// featureExtraction // working
client.featureExtraction({
    model: "intfloat/multilingual-e5-large-instruct",
    inputs: "Today is a sunny day and I will get some ice cream.",
}).then((output) => {
    console.log('featureExtraction', output);
});

// for text editing // working
client.fillMask({
    model: "google-bert/bert-base-uncased",
    inputs: "The answer to the [MASK] is simple.",
}).then(result => {
    console.log("fillMask", result);
});

// a dog image
const image_url = 'https://picsum.photos/id/237/200/300';

fetch(image_url).then((res) => {
    res.blob().then(blob => {
        // working
        client.imageClassification({
            inputs: blob,
            model: "skyau/dog-breed-classifier-vit",
        }).then((result) => {
            console.log("imageClassification", result);
            // label Labrador_retriever should have the highest probability
        });

        // imageSegmentation // not working
        // client.imageSegmentation({
        //     inputs: blob,
        //     model: "brikwerk/image-difference-segmentation",
        // }).then((result) => {
        //     console.log("imageSegmentation", result);
        // });

        // working
        client.objectDetection({
            inputs: blob,
            model: 'facebook/detr-resnet-50'
        }).then(result => {
            console.log("objectDetection", result);
            // should say dog
        });

    });
});

// working
client.questionAnswering({
    inputs: {
        question: "What is my name?",
        context: "My name is Clara and I live in Berkeley.",
    },
    model: 'deepset/roberta-base-squad2'
}).then(result => {
    console.log("questionAnswering", result);
    // should say Clara
});

// working
client.summarization({
    model: "facebook/bart-large-cnn",
    inputs: "My name is chuck. The tower is 324 metres (1,063 ft) tall, about the same height as an 81-storey building, and the tallest structure in Paris. Its base is square, measuring 125 metres (410 ft) on each side. During its construction, the Eiffel Tower surpassed the Washington Monument to become the tallest man-made structure in the world, a title it held for 41 years until the Chrysler Building in New York City was finished in 1930. It was the first structure to reach a height of 300 metres. Due to the addition of a broadcasting aerial at the top of the tower in 1957, it is now taller than the Chrysler Building by 5.2 metres (17 ft). Excluding transmitters, the Eiffel Tower is the second tallest free-standing structure in France after the Millau Viaduct.",
}).then(result => {
    console.log("summarization", result);
    // should not mention that my name is chuck
});

// working
client.tableQuestionAnswering({
    inputs: {
        question: "How many stars does the transformers repository have?",
        table: {
            "Repository": ["Transformers", "Datasets", "Tokenizers"],
            "Stars": ["36542", "4512", "3934"],
            "Contributors": ["651", "77", "34"],
            "Programming language": ["Python", "Python", "Rust, Python and NodeJS"]
        },
    },
    model:"google/tapas-base-finetuned-wtq"
}).then(result => {
    console.log("tableQuestionAnswering", result);
    // should mention 36542
})

// working
client.textClassification({
    model: "tabularisai/multilingual-sentiment-analysis",
    inputs: "I like you. I love you",
    provider: "hf-inference",
}).then(result => {
    console.log("textClassification", result);
    // should mention 36542
})

// working
client.textToImage({
    model: "black-forest-labs/FLUX.1-dev",
    inputs: "Astronaut riding a horse",
    parameters: { num_inference_steps: 5 },
}).then(result => {
    console.log("textToImage", result);
    // should be a blob
});

// working
client.translation({
    model: "Helsinki-NLP/opus-mt-ru-en",
    inputs: "Меня зовут Вольфганг и я живу в Берлине",
}).then(result => {
    console.log("translation", result);
    // about a fella livin in berlin
});
