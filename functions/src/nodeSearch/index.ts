
import { genkit } from 'genkit';
import { vertexAI, textEmbedding004 } from "@genkit-ai/vertexai";

import { applicationDefault, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

import { chunk } from "llm-chunk";

import { readFile } from "fs/promises";
import path from "path";

// Change these values to match your Firestore config/schema
const indexConfig = {
    collection: "menuInfo",
    contentField: "text",
    vectorField: "embedding",
    embedder: textEmbedding004,
};

const ai = genkit({
    plugins: [vertexAI({ location: "us-central1" })],
});

const app = initializeApp({ credential: applicationDefault() });
const firestore = getFirestore(app);

export async function indexMenu(filePath: string) {
    filePath = path.resolve(filePath);

    // Read the PDF.
    const pdfTxt = await nodeBluePrintToText(filePath);

    // Divide the PDF text into segments.
    const chunks = await chunk(pdfTxt);

    // Add chunks to the index.
    await indexToFirestore(chunks);
}

async function indexToFirestore(data: string[]) {
    for (const text of data) {
        const embedding = (await ai.embed({
            embedder: indexConfig.embedder,
            content: text,
        }))[0].embedding;
        await firestore.collection(indexConfig.collection).add({
            [indexConfig.vectorField]: FieldValue.vector(embedding),
            [indexConfig.contentField]: text,
        });
    }
}

async function nodeBluePrintToText(nid: string) {
    const pdfFile = path.resolve(filePath);
    const dataBuffer = await readFile(pdfFile);
    const data = await pdf(dataBuffer);
    return data.text;
}





import { defineFirestoreRetriever } from '@genkit-ai/firebase';

const retriever = defineFirestoreRetriever(ai, {
    name: 'exampleRetriever',
    firestore,
    collection: 'documents',
    contentField: 'text', // Field containing document content
    vectorField: 'embedding', // Field containing vector embeddings
    embedder: indexConfig.embedder, // Embedder to generate embeddings
    distanceMeasure: 'COSINE', // Default is 'COSINE'; other options: 'EUCLIDEAN', 'DOT_PRODUCT'
});


const docs = await ai.retrieve({
    retriever,
    query: 'search query',
    options: {
        limit: 5, // Options: Return up to 5 documents
        where: { category: 'example' }, // Optional: Filter by field-value pairs
        collection: 'alternativeCollection', // Optional: Override default collection
    },
});