# HuggingFace Inference API - Firebase Cloud Functions

This document provides comprehensive documentation for the HuggingFace Inference API endpoints implemented as Firebase Cloud Functions.

## Setup

### 1. Configure HuggingFace Token

Set your HuggingFace token using one of these methods:

```bash
# Method 1: Environment variable
export HUGGINGFACE_TOKEN="your_token_here"

# Method 2: Firebase functions config
firebase functions:config:set huggingface.token="your_token_here"
```

### 2. Deploy Functions

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

## Authentication

All endpoints require Firebase Authentication. Include the Firebase ID token in the Authorization header:

```javascript
Authorization: Bearer YOUR_FIREBASE_ID_TOKEN
```

## Endpoints

### 1. Text Generation

**Endpoint:** `POST /textGeneration`

Generates text based on input prompt.

**Request Body:**
```json
{
  "inputs": "The future of AI is",
  "model": "microsoft/DialoGPT-medium",
  "parameters": {
    "max_length": 50,
    "temperature": 0.7,
    "do_sample": true
  }
}
```

**Response:**
```json
[
  {
    "generated_text": "The future of AI is bright and full of possibilities..."
  }
]
```

**Example cURL:**
```bash
curl -X POST https://your-region-your-project.cloudfunctions.net/textGeneration \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "inputs": "The future of AI is",
    "parameters": {
      "max_length": 50,
      "temperature": 0.7
    }
  }'
```

### 2. Text Classification

**Endpoint:** `POST /textClassification`

Classifies text into predefined categories.

**Request Body:**
```json
{
  "inputs": "I love this product! It's amazing.",
  "model": "cardiffnlp/twitter-roberta-base-sentiment-latest"
}
```

**Response:**
```json
[
  [
    {"label": "POSITIVE", "score": 0.999},
    {"label": "NEGATIVE", "score": 0.001}
  ]
]
```

**Example cURL:**
```bash
curl -X POST https://your-region-your-project.cloudfunctions.net/textClassification \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "inputs": "I love this product! It'\''s amazing."
  }'
```

### 3. Token Classification (Named Entity Recognition)

**Endpoint:** `POST /tokenClassification`

Identifies named entities in text.

**Request Body:**
```json
{
  "inputs": "My name is Sarah and I work at Microsoft in Seattle.",
  "model": "dbmdz/bert-large-cased-finetuned-conll03-english",
  "parameters": {
    "aggregation_strategy": "simple"
  }
}
```

**Response:**
```json
[
  {
    "entity_group": "PER",
    "score": 0.999,
    "word": "Sarah",
    "start": 11,
    "end": 16
  },
  {
    "entity_group": "ORG",
    "score": 0.999,
    "word": "Microsoft",
    "start": 30,
    "end": 39
  }
]
```

### 4. Question Answering

**Endpoint:** `POST /questionAnswering`

Answers questions based on provided context.

**Request Body:**
```json
{
  "inputs": {
    "question": "What is the capital of France?",
    "context": "France is a country in Europe. Its capital city is Paris, which is also its largest city."
  },
  "model": "deepset/roberta-base-squad2"
}
```

**Response:**
```json
{
  "answer": "Paris",
  "score": 0.999,
  "start": 65,
  "end": 70
}
```

### 5. Fill Mask

**Endpoint:** `POST /fillMask`

Predicts masked tokens in text.

**Request Body:**
```json
{
  "inputs": "The weather today is [MASK].",
  "model": "google-bert/bert-base-uncased",
  "parameters": {
    "top_k": 5
  }
}
```

**Response:**
```json
[
  {
    "score": 0.123,
    "token": 2204,
    "token_str": "nice",
    "sequence": "the weather today is nice."
  }
]
```

### 6. Summarization

**Endpoint:** `POST /summarization`

Generates summaries of long text.

**Request Body:**
```json
{
  "inputs": "The tower is 324 metres (1,063 ft) tall, about the same height as an 81-storey building, and the tallest structure in Paris...",
  "model": "facebook/bart-large-cnn",
  "parameters": {
    "max_length": 130,
    "min_length": 30,
    "do_sample": false
  }
}
```

**Response:**
```json
[
  {
    "summary_text": "The tower is 324 metres tall and is the tallest structure in Paris."
  }
]
```

### 7. Translation

**Endpoint:** `POST /translation`

Translates text between languages.

**Request Body:**
```json
{
  "inputs": "Hello, how are you?",
  "model": "Helsinki-NLP/opus-mt-en-fr"
}
```

**Response:**
```json
[
  {
    "translation_text": "Bonjour, comment allez-vous ?"
  }
]
```

### 8. Sentence Similarity

**Endpoint:** `POST /sentenceSimilarity`

Computes similarity between sentences.

**Request Body:**
```json
{
  "inputs": {
    "source_sentence": "That is a happy person",
    "sentences": [
      "That is a happy dog",
      "That is a very happy person",
      "Today is a sunny day"
    ]
  },
  "model": "sentence-transformers/all-MiniLM-L6-v2"
}
```

**Response:**
```json
[0.695, 0.945, 0.247]
```

### 9. Conversational

**Endpoint:** `POST /conversational`

Generates conversational responses.

**Request Body:**
```json
{
  "inputs": {
    "past_user_inputs": ["Which movie is the best ?"],
    "generated_responses": ["It's hard to say, but I would go with Shawshank Redemption."],
    "text": "Can you tell me why?"
  },
  "model": "microsoft/DialoGPT-medium",
  "parameters": {
    "max_length": 1000,
    "temperature": 0.7
  }
}
```

**Response:**
```json
{
  "generated_text": "Because it has a great story and excellent character development.",
  "conversation": {
    "past_user_inputs": ["Which movie is the best ?", "Can you tell me why?"],
    "generated_responses": ["It's hard to say, but I would go with Shawshank Redemption.", "Because it has a great story and excellent character development."]
  }
}
```

### 10. Feature Extraction

**Endpoint:** `POST /featureExtraction`

Extracts feature vectors from text.

**Request Body:**
```json
{
  "inputs": "This is a sample sentence.",
  "model": "intfloat/multilingual-e5-large-instruct"
}
```

**Response:**
```json
[
  [0.123, -0.456, 0.789, ...]
]
```

### 11. Image Classification

**Endpoint:** `POST /imageClassification`

Classifies images into categories.

**Request Body:**
```json
{
  "inputs": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgo...",
  "model": "google/vit-base-patch16-224"
}
```

**Response:**
```json
[
  {
    "label": "cat",
    "score": 0.999
  },
  {
    "label": "dog",
    "score": 0.001
  }
]
```

### 12. Object Detection

**Endpoint:** `POST /objectDetection`

Detects objects in images.

**Request Body:**
```json
{
  "inputs": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgo...",
  "model": "facebook/detr-resnet-50",
  "parameters": {
    "threshold": 0.5
  }
}
```

**Response:**
```json
[
  {
    "score": 0.999,
    "label": "person",
    "box": {
      "xmin": 123,
      "ymin": 456,
      "xmax": 789,
      "ymax": 1012
    }
  }
]
```

### 13. Automatic Speech Recognition

**Endpoint:** `POST /automaticSpeechRecognition`

Transcribes audio to text.

**Request Body:**
```json
{
  "inputs": "data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ4AAAC...",
  "model": "openai/whisper-large-v3"
}
```

**Response:**
```json
{
  "text": "Hello, this is a test audio file."
}
```

### 14. Table Question Answering

**Endpoint:** `POST /tableQuestionAnswering`

Answers questions about tabular data.

**Request Body:**
```json
{
  "inputs": {
    "query": "How many stars does the transformers repository have?",
    "table": {
      "Repository": ["Transformers", "Datasets", "Tokenizers"],
      "Stars": ["36542", "4512", "3934"],
      "Contributors": ["651", "77", "34"]
    }
  },
  "model": "google/tapas-base-finetuned-wtq"
}
```

**Response:**
```json
{
  "answer": "36542",
  "coordinates": [[0, 1]],
  "cells": ["36542"],
  "aggregator": "NONE"
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad Request (missing required fields)
- `401`: Unauthorized (invalid or missing token)
- `500`: Internal Server Error

## Rate Limits

HuggingFace Inference API has rate limits. Consider implementing caching or request queuing for production applications.

## Model Selection

Each endpoint uses a default model but accepts a custom `model` parameter in the request body. Ensure the specified model supports the requested task.

## Best Practices

1. **Error Handling**: Always implement proper error handling in your client applications
2. **Timeout**: Set appropriate timeouts for API calls
3. **Caching**: Cache responses when appropriate to reduce API calls
4. **Model Selection**: Choose models appropriate for your use case and data
5. **Authentication**: Secure your Firebase ID tokens and implement proper authentication flows

## JavaScript/TypeScript Example

```javascript
// Example client-side usage
async function callHuggingFaceAPI(endpoint, data) {
  const user = firebase.auth().currentUser;
  if (!user) throw new Error('User not authenticated');
  
  const token = await user.getIdToken();
  
  const response = await fetch(`https://your-region-your-project.cloudfunctions.net/${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API call failed');
  }
  
  return response.json();
}

// Usage examples
const sentiment = await callHuggingFaceAPI('textClassification', {
  inputs: 'I love this product!'
});

const summary = await callHuggingFaceAPI('summarization', {
  inputs: 'Long text to summarize...',
  parameters: { max_length: 100 }
});
```

## Support

For issues with the HuggingFace models or API responses, refer to the [HuggingFace documentation](https://huggingface.co/docs/api-inference/index).

For Firebase Functions issues, check the [Firebase Functions documentation](https://firebase.google.com/docs/functions).