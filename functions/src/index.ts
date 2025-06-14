import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

admin.initializeApp();

const HF_TOKEN = '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';//functions.config().huggingface.token;
const BASE_URL = 'https://api-inference.huggingface.co/models';

const SUPPORTED_TASKS = new Set([
    'image-classification', 'object-detection', 'zero-shot-classification',
    'text-generation', 'token-classification', 'text-to-image',
    'text-to-speech', 'translation', 'summarization', 'question-answering',
    'sentence-similarity', 'conversational', 'fill-mask', 'text-classification',
    'image-to-text', 'audio-classification', 'automatic-speech-recognition',
    'tabular-classification', 'tabular-regression', 'text-to-audio', 'embeddings'
]);

export const proxyHuggingFace = functions.https.onRequest(async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith('Bearer ')) {
            await res.status(401).json({ error: 'Missing or invalid Authorization header' });
            return Promise.resolve();
        }

        const idToken = authHeader.split('Bearer ')[1];
        await admin.auth().verifyIdToken(idToken);

        const task = req.query.task?.toString();
        const model = req.query.model?.toString() || getDefaultModel(task);

        if (!task || !SUPPORTED_TASKS.has(task)) {
            await res.status(400).json({ error: 'Invalid or missing task' });
            return Promise.resolve();
        }

        if (!model) {
            await res.status(400).json({ error: 'Missing model for the specified task' });
            return Promise.resolve();
        }

        const hfResponse = await axios({
            method: 'POST',
            url: `${BASE_URL}/${model}`,
            headers: {
                Authorization: `Bearer ${HF_TOKEN}`,
                'Content-Type': req.headers['content-type'] || 'application/json',
            },
            data: req.body,
            responseType: 'json',
        });

        await res.status(200).json(hfResponse.data);
    } catch (error: any) {
        console.error('HF Proxy Error:', error.response?.data || error.message);

        await res.status(error.response?.status || 500).json({
            error: error.response?.data || 'Internal Server Error',
        });
    }
});

function getDefaultModel(task?: string): string | null {
    const defaults: Record<string, string> = {
        'image-classification': 'google/vit-base-patch16-224',
        'object-detection': 'facebook/detr-resnet-50',
        'zero-shot-classification': 'facebook/bart-large-mnli',
        'text-generation': 'gpt2',
        'token-classification': 'dbmdz/bert-large-cased-finetuned-conll03-english',
        'text-to-image': 'stabilityai/stable-diffusion-2',
        'text-to-speech': 'espnet/kan-bayashi_ljspeech_vits',
        'translation': 't5-base',
        'summarization': 'sshleifer/distilbart-cnn-12-6',
        'question-answering': 'distilbert-base-cased-distilled-squad',
        'sentence-similarity': 'sentence-transformers/all-MiniLM-L6-v2',
        'conversational': 'microsoft/DialoGPT-medium',
        'fill-mask': 'bert-base-uncased',
        'text-classification': 'distilbert-base-uncased-finetuned-sst-2-english',
        'image-to-text': 'nlpconnect/vit-gpt2-image-captioning',
        'audio-classification': 'superb/hubert-large-superb-er',
        'automatic-speech-recognition': 'facebook/wav2vec2-base-960h',
        'tabular-classification': 'huggingface/gradient-boosting-classifier',
        'tabular-regression': 'huggingface/gradient-boosting-regressor',
        'text-to-audio': 'espnet/kan-bayashi_ljspeech_vits',
        'embeddings': 'sentence-transformers/all-MiniLM-L6-v2'
    };
    return task ? defaults[task] || null : null;
}
