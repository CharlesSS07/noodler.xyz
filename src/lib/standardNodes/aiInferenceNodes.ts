import type { NodeBluePrintControllerFactoryInterface } from '../../routes/app/lib/NodeBluePrint.js';
import { FirestoreNodeBluePrintControllerFactoryInterface } from '../../routes/app/lib/FirestoreNodeBluePrint.js';
import {
    NumberSocketParamsBuilder,
    StringSocketParamsBuilder,
    JIMPImageSocketParamsBuilder,
    GenericSocketParamsBuilder,
} from '../../routes/app/lib/SocketParamBuilders.js';
import { STANDARD_DATATYPES } from '../../routes/app/lib/DataTypes.js';

const factory: NodeBluePrintControllerFactoryInterface =
    new FirestoreNodeBluePrintControllerFactoryInterface();

export async function aiInferenceNodes() {
    // TEXT TO IMAGE NODE
    const textToImage =
        await factory.initOfficialNodeBluePrint('ai_text_to_image');
    textToImage.title = 'AI Text to Image';
    textToImage.documentation = 'Generates an image from text using AI models.';

    textToImage.newInputSocket('prompt', {
        label: 'Prompt',
        documentation: 'Text description of the image to generate.',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder(
            'A beautiful sunset over mountains'
        )
            .asParagraph()
            .build(),
    });

    textToImage.newInputSocket('model', {
        label: 'Model',
        documentation: 'AI model to use for generation.',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder(
            'runwayml/stable-diffusion-v1-5'
        ).build(),
    });

    textToImage.newInputSocket('num_inference_steps', {
        label: 'Inference Steps',
        documentation:
            'Number of denoising steps (higher = better quality, slower).',
        type: STANDARD_DATATYPES.NUMBER,
        params: new NumberSocketParamsBuilder(50).setMin(1).setMax(100).build(),
    });

    textToImage.newInputSocket('guidance_scale', {
        label: 'Guidance Scale',
        documentation:
            'How closely to follow the prompt (higher = more adherent).',
        type: STANDARD_DATATYPES.NUMBER,
        params: new NumberSocketParamsBuilder(7.5)
            .setMin(1)
            .setMax(20)
            .setStep(0.5)
            .build(),
    });

    textToImage.newInputSocket('negative_prompt', {
        label: 'Negative Prompt',
        documentation: 'What to avoid in the generated image.',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder('blurry, low quality, distorted')
            .asParagraph()
            .build(),
    });

    textToImage.newInputSocket('height', {
        label: 'Height',
        documentation: 'Image height in pixels.',
        type: STANDARD_DATATYPES.NUMBER,
        params: new NumberSocketParamsBuilder(512)
            .setMin(64)
            .setMax(1024)
            .setStep(64)
            .build(),
    });

    textToImage.newInputSocket('width', {
        label: 'Width',
        documentation: 'Image width in pixels.',
        type: STANDARD_DATATYPES.NUMBER,
        params: new NumberSocketParamsBuilder(512)
            .setMin(64)
            .setMax(1024)
            .setStep(64)
            .build(),
    });

    textToImage.newOutputSocket('image', {
        label: 'Generated Image',
        documentation: 'The AI-generated image.',
        type: STANDARD_DATATYPES.IMAGE_JIMP,
    });

    textToImage.code = `
        const aiService = await utils.APIConnectionManager.getConnector("ai_inference").getAPI();
        const result = await aiService.textToImage({
            inputs: inputs.prompt,
            model: inputs.model,
            parameters: {
                num_inference_steps: inputs.num_inference_steps,
                guidance_scale: inputs.guidance_scale,
                negative_prompt: inputs.negative_prompt,
                height: inputs.height,
                width: inputs.width,
            }
        });
        outputs.set('image', result);
    `;

    // OBJECT DETECTION NODE
    const objectDetection = await factory.initOfficialNodeBluePrint(
        'ai_object_detection'
    );
    objectDetection.title = 'AI Object Detection';
    objectDetection.documentation =
        'Detects objects in images with bounding boxes.';

    objectDetection.newInputSocket('image', {
        label: 'Image',
        documentation: 'Image to analyze for objects.',
        type: STANDARD_DATATYPES.IMAGE_JIMP,
        params: new JIMPImageSocketParamsBuilder().build(),
    });

    objectDetection.newInputSocket('model', {
        label: 'Model',
        documentation: 'Object detection model to use.',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder(
            'facebook/detr-resnet-50'
        ).build(),
    });

    objectDetection.newInputSocket('threshold', {
        label: 'Confidence Threshold',
        documentation: 'Minimum confidence score for detections.',
        type: STANDARD_DATATYPES.NUMBER,
        params: new NumberSocketParamsBuilder(0.5)
            .setMin(0.1)
            .setMax(1.0)
            .setStep(0.1)
            .build(),
    });

    objectDetection.newOutputSocket('detections', {
        label: 'Object Detections',
        documentation:
            'Array of detected objects with labels, scores, and bounding boxes.',
        type: 'unknown',
    });

    objectDetection.code = `
        const aiService = await utils.APIConnectionManager.getConnector("ai_inference").getAPI();
        const detections = await aiService.objectDetection({
            inputs: inputs.image,
            model: inputs.model,
            parameters: {
                threshold: inputs.threshold
            }
        });
        outputs.set('detections', detections);
    `;

    // TEXT GENERATION NODE
    const textGeneration =
        await factory.initOfficialNodeBluePrint('ai_text_generation');
    textGeneration.title = 'AI Text Generation';
    textGeneration.documentation =
        'Generates text completions using language models.';

    textGeneration.newInputSocket('prompt', {
        label: 'Text Prompt',
        documentation: 'Text to complete or continue.',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder('Once upon a time')
            .asParagraph()
            .build(),
    });

    textGeneration.newInputSocket('model', {
        label: 'Model',
        documentation: 'Language model to use.',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder('gpt2').build(),
    });

    textGeneration.newInputSocket('max_length', {
        label: 'Max Length',
        documentation: 'Maximum length of generated text.',
        type: STANDARD_DATATYPES.NUMBER,
        params: new NumberSocketParamsBuilder(100)
            .setMin(10)
            .setMax(1000)
            .build(),
    });

    textGeneration.newInputSocket('temperature', {
        label: 'Temperature',
        documentation: 'Creativity level (higher = more creative).',
        type: STANDARD_DATATYPES.NUMBER,
        params: new NumberSocketParamsBuilder(0.7)
            .setMin(0.1)
            .setMax(2.0)
            .setStep(0.1)
            .build(),
    });

    textGeneration.newInputSocket('do_sample', {
        label: 'Use Sampling',
        documentation: 'Whether to use sampling for generation.',
        type: STANDARD_DATATYPES.BOOLEAN,
        params: new GenericSocketParamsBuilder(true).build(),
    });

    textGeneration.newInputSocket('top_k', {
        label: 'Top K',
        documentation: 'Limit vocabulary to top K tokens.',
        type: STANDARD_DATATYPES.NUMBER,
        params: new NumberSocketParamsBuilder(50).setMin(1).setMax(100).build(),
    });

    textGeneration.newInputSocket('top_p', {
        label: 'Top P',
        documentation: 'Nucleus sampling parameter.',
        type: STANDARD_DATATYPES.NUMBER,
        params: new NumberSocketParamsBuilder(0.9)
            .setMin(0.1)
            .setMax(1.0)
            .setStep(0.1)
            .build(),
    });

    textGeneration.newOutputSocket('generated_text', {
        label: 'Generated Text',
        documentation: 'The generated text completion.',
        type: STANDARD_DATATYPES.STRING,
    });

    textGeneration.code = `
        const aiService = await utils.APIConnectionManager.getConnector("ai_inference").getAPI();
        const results = await aiService.textGeneration({
            inputs: inputs.prompt,
            model: inputs.model,
            parameters: {
                max_length: inputs.max_length,
                temperature: inputs.temperature,
                do_sample: inputs.do_sample,
                top_k: inputs.top_k,
                top_p: inputs.top_p
            }
        });
        outputs.set('generated_text', results[0]?.generated_text || '');
    `;

    // TEXT CLASSIFICATION NODE
    const textClassification = await factory.initOfficialNodeBluePrint(
        'ai_text_classification'
    );
    textClassification.title = 'AI Text Classification';
    textClassification.documentation =
        'Classifies text into categories (sentiment, topic, etc.).';

    textClassification.newInputSocket('text', {
        label: 'Text',
        documentation: 'Text to classify.',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder(
            'I love this product! It works amazingly well.'
        )
            .asParagraph()
            .build(),
    });

    textClassification.newInputSocket('model', {
        label: 'Model',
        documentation: 'Classification model to use.',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder(
            'cardiffnlp/twitter-roberta-base-sentiment-latest'
        ).build(),
    });

    textClassification.newOutputSocket('results', {
        label: 'Classification Results',
        documentation:
            'Array of classification results with labels and scores.',
        type: 'unknown',
    });

    textClassification.code = `
        const aiService = await utils.APIConnectionManager.getConnector("ai_inference").getAPI();
        const results = await aiService.textClassification({
            inputs: inputs.text,
            model: inputs.model
        });
        outputs.set('results', results[0] || []);
    `;

    // QUESTION ANSWERING NODE
    const questionAnswering = await factory.initOfficialNodeBluePrint(
        'ai_question_answering'
    );
    questionAnswering.title = 'AI Question Answering';
    questionAnswering.documentation =
        'Answers questions based on provided context.';

    questionAnswering.newInputSocket('question', {
        label: 'Question',
        documentation: 'Question to answer.',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder('What is the capital of France?')
            .asSentence()
            .build(),
    });

    questionAnswering.newInputSocket('context', {
        label: 'Context',
        documentation: 'Context text containing the answer.',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder(
            'France is a country in Europe. Paris is the capital and largest city of France.'
        )
            .asParagraph()
            .build(),
    });

    questionAnswering.newInputSocket('model', {
        label: 'Model',
        documentation: 'Question answering model to use.',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder(
            'distilbert-base-cased-distilled-squad'
        ).build(),
    });

    questionAnswering.newOutputSocket('answer', {
        label: 'Answer',
        documentation: 'The extracted answer.',
        type: STANDARD_DATATYPES.STRING,
    });

    questionAnswering.newOutputSocket('score', {
        label: 'Confidence Score',
        documentation: 'Confidence score of the answer.',
        type: STANDARD_DATATYPES.NUMBER,
    });

    questionAnswering.code = `
        const aiService = await utils.APIConnectionManager.getConnector("ai_inference").getAPI();
        const result = await aiService.questionAnswering({
            inputs: {
                question: inputs.question,
                context: inputs.context
            },
            model: inputs.model
        });
        outputs.set('answer', result.answer);
        outputs.set('score', result.score);
    `;

    // SUMMARIZATION NODE
    const summarization =
        await factory.initOfficialNodeBluePrint('ai_summarization');
    summarization.title = 'AI Text Summarization';
    summarization.documentation = 'Summarizes long text into shorter versions.';

    summarization.newInputSocket('text', {
        label: 'Text to Summarize',
        documentation: 'Long text to be summarized.',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder('').asParagraph().build(),
    });

    summarization.newInputSocket('model', {
        label: 'Model',
        documentation: 'Summarization model to use.',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder(
            'facebook/bart-large-cnn'
        ).build(),
    });

    summarization.newInputSocket('max_length', {
        label: 'Max Summary Length',
        documentation: 'Maximum length of the summary.',
        type: STANDARD_DATATYPES.NUMBER,
        params: new NumberSocketParamsBuilder(150)
            .setMin(10)
            .setMax(500)
            .build(),
    });

    summarization.newInputSocket('min_length', {
        label: 'Min Summary Length',
        documentation: 'Minimum length of the summary.',
        type: STANDARD_DATATYPES.NUMBER,
        params: new NumberSocketParamsBuilder(30).setMin(5).setMax(100).build(),
    });

    summarization.newOutputSocket('summary', {
        label: 'Summary',
        documentation: 'The generated summary.',
        type: STANDARD_DATATYPES.STRING,
    });

    summarization.code = `
        const aiService = await utils.APIConnectionManager.getConnector("ai_inference").getAPI();
        const results = await aiService.summarization({
            inputs: inputs.text,
            model: inputs.model,
            parameters: {
                max_length: inputs.max_length,
                min_length: inputs.min_length,
                do_sample: false
            }
        });
        outputs.set('summary', results?.summary_text || '');
    `;

    // TRANSLATION NODE
    const translation =
        await factory.initOfficialNodeBluePrint('ai_translation');
    translation.title = 'AI Language Translation';
    translation.documentation = 'Translates text between languages.';

    translation.newInputSocket('text', {
        label: 'Text to Translate',
        documentation: 'Text in source language.',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder('Hello, how are you?')
            .asSentence()
            .build(),
    });

    translation.newInputSocket('model', {
        label: 'Translation Model',
        documentation:
            'Translation model (e.g., "Helsinki-NLP/opus-mt-en-fr" for English to French).',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder(
            'Helsinki-NLP/opus-mt-en-fr'
        ).build(),
    });

    translation.newOutputSocket('translated_text', {
        label: 'Translated Text',
        documentation: 'Text in target language.',
        type: STANDARD_DATATYPES.STRING,
    });

    translation.code = `
        const aiService = await utils.APIConnectionManager.getConnector("ai_inference").getAPI();
        const results = await aiService.translation({
            inputs: inputs.text,
            model: inputs.model
        });
        outputs.set('translated_text', results[0]?.translation_text || '');
    `;

    // FILL MASK NODE
    const fillMask = await factory.initOfficialNodeBluePrint('ai_fill_mask');
    fillMask.title = 'AI Fill Mask';
    fillMask.documentation = 'Predicts masked words in text.';

    fillMask.newInputSocket('text', {
        label: 'Text with Mask',
        documentation: 'Text with [MASK] token to fill.',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder('The weather today is [MASK].')
            .asSentence()
            .build(),
    });

    fillMask.newInputSocket('model', {
        label: 'Model',
        documentation: 'Fill mask model to use.',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder('bert-base-uncased').build(),
    });

    fillMask.newInputSocket('top_k', {
        label: 'Top K Results',
        documentation: 'Number of top predictions to return.',
        type: STANDARD_DATATYPES.NUMBER,
        params: new NumberSocketParamsBuilder(5).setMin(1).setMax(10).build(),
    });

    fillMask.newOutputSocket('predictions', {
        label: 'Mask Predictions',
        documentation: 'Array of predicted words with scores.',
        type: 'unknown',
    });

    fillMask.code = `
        const aiService = await utils.APIConnectionManager.getConnector("ai_inference").getAPI();
        const results = await aiService.fillMask({
            inputs: inputs.text,
            model: inputs.model,
            parameters: {
                top_k: inputs.top_k
            }
        });
        outputs.set('predictions', results);
    `;

    // SENTENCE SIMILARITY NODE
    const sentenceSimilarity = await factory.initOfficialNodeBluePrint(
        'ai_sentence_similarity'
    );
    sentenceSimilarity.title = 'AI Sentence Similarity';
    sentenceSimilarity.documentation =
        'Computes semantic similarity between sentences.';

    sentenceSimilarity.newInputSocket('source_sentence', {
        label: 'Source Sentence',
        documentation: 'Reference sentence to compare against.',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder('The cat is sleeping.')
            .asSentence()
            .build(),
    });

    sentenceSimilarity.newInputSocket('sentences', {
        label: 'Sentences to Compare',
        documentation: 'Array of sentences to compare (as JSON array).',
        type: 'unknown',
        params: new GenericSocketParamsBuilder([
            'The dog is resting.',
            'I like pizza.',
            'A feline is napping.',
        ]).build(),
    });

    sentenceSimilarity.newInputSocket('model', {
        label: 'Model',
        documentation: 'Sentence similarity model to use.',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder(
            'sentence-transformers/all-MiniLM-L6-v2'
        ).build(),
    });

    sentenceSimilarity.newOutputSocket('similarities', {
        label: 'Similarity Scores',
        documentation: 'Array of similarity scores (0-1).',
        type: 'unknown',
    });

    sentenceSimilarity.code = `
        const aiService = await utils.APIConnectionManager.getConnector("ai_inference").getAPI();
        const results = await aiService.sentenceSimilarity({
            inputs: {
                source_sentence: inputs.source_sentence,
                sentences: Array.isArray(inputs.sentences) ? inputs.sentences : [inputs.sentences]
            },
            model: inputs.model
        });
        outputs.set('similarities', results);
    `;

    // FEATURE EXTRACTION NODE
    const featureExtraction = await factory.initOfficialNodeBluePrint(
        'ai_feature_extraction'
    );
    featureExtraction.title = 'AI Feature Extraction';
    featureExtraction.documentation = 'Extracts feature embeddings from text.';

    featureExtraction.newInputSocket('text', {
        label: 'Text',
        documentation: 'Text to extract features from.',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder(
            'This is a sample text for feature extraction.'
        )
            .asSentence()
            .build(),
    });

    featureExtraction.newInputSocket('model', {
        label: 'Model',
        documentation: 'Feature extraction model to use.',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder(
            'sentence-transformers/all-MiniLM-L6-v2'
        ).build(),
    });

    featureExtraction.newOutputSocket('features', {
        label: 'Feature Vector',
        documentation: 'Extracted feature embeddings as numerical array.',
        type: STANDARD_DATATYPES.TENSOR,
    });

    featureExtraction.code = `
        const aiService = await utils.APIConnectionManager.getConnector("ai_inference").getAPI();
        const results = await aiService.featureExtraction({
            inputs: inputs.text,
            model: inputs.model
        });
        outputs.set('features', results);
    `;

    // AUTOMATIC SPEECH RECOGNITION NODE
    const automaticSpeechRecognition = await factory.initOfficialNodeBluePrint(
        'ai_speech_recognition'
    );
    automaticSpeechRecognition.title = 'AI Speech Recognition';
    automaticSpeechRecognition.documentation =
        'Converts audio to text using speech recognition.';

    automaticSpeechRecognition.newInputSocket('audio_data', {
        label: 'Audio Data',
        documentation: 'Base64 encoded audio data.',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder('').asParagraph().build(),
    });

    automaticSpeechRecognition.newInputSocket('model', {
        label: 'Model',
        documentation: 'Speech recognition model to use.',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder('openai/whisper-small').build(),
    });

    automaticSpeechRecognition.newOutputSocket('text', {
        label: 'Transcribed Text',
        documentation: 'Transcribed text from audio.',
        type: STANDARD_DATATYPES.STRING,
    });

    automaticSpeechRecognition.code = `
        const aiService = await utils.APIConnectionManager.getConnector("ai_inference").getAPI();
        const result = await aiService.automaticSpeechRecognition({
            inputs: inputs.audio_data,
            model: inputs.model
        });
        outputs.set('text', result.text);
    `;

    // TABLE QUESTION ANSWERING NODE
    const tableQuestionAnswering =
        await factory.initOfficialNodeBluePrint('ai_table_qa');
    tableQuestionAnswering.title = 'AI Table Question Answering';
    tableQuestionAnswering.documentation =
        'Answers questions about tabular data.';

    tableQuestionAnswering.newInputSocket('question', {
        label: 'Question',
        documentation: 'Question about the table data.',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder('How many employees are there?')
            .asSentence()
            .build(),
    });

    tableQuestionAnswering.newInputSocket('table', {
        label: 'Table Data',
        documentation: 'Table as JSON object with column headers as keys.',
        type: 'unknown',
        params: new GenericSocketParamsBuilder({
            Name: ['John', 'Jane', 'Bob'],
            Age: ['25', '30', '35'],
            Department: ['Sales', 'Marketing', 'Engineering'],
        }).build(),
    });

    tableQuestionAnswering.newInputSocket('model', {
        label: 'Model',
        documentation: 'Table QA model to use.',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder(
            'google/tapas-base-finetuned-wtq'
        ).build(),
    });

    tableQuestionAnswering.newOutputSocket('answer', {
        label: 'Answer',
        documentation: 'Answer extracted from the table.',
        type: STANDARD_DATATYPES.STRING,
    });

    tableQuestionAnswering.newOutputSocket('coordinates', {
        label: 'Cell Coordinates',
        documentation: 'Coordinates of relevant table cells.',
        type: 'unknown',
    });

    tableQuestionAnswering.code = `
        const aiService = await utils.APIConnectionManager.getConnector("ai_inference").getAPI();
        const result = await aiService.tableQuestionAnswering({
            inputs: {
                query: inputs.question,
                table: inputs.table
            },
            model: inputs.model
        });
        outputs.set('answer', result.answer);
        outputs.set('coordinates', result.coordinates);
    `;

}
