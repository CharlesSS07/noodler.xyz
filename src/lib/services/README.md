# AI Inference Service

A comprehensive client-side service for calling HuggingFace AI functions with automatic authentication and JIMP image handling.

## Features

- 🔐 **Automatic Authentication**: Uses Firebase Auth tokens automatically
- 🖼️ **JIMP Integration**: Seamless conversion between JIMP images and API formats
- 📝 **Full Type Safety**: Complete TypeScript support with detailed interfaces
- 🎨 **Text-to-Image**: Generate images from text prompts
- 👁️ **Image Processing**: Classification, object detection, and more
- 💬 **Text Processing**: NLP tasks like summarization, Q&A, sentiment analysis
- 🛠️ **Image Utilities**: Resizing, validation, format conversion
- ✅ **Comprehensive Testing**: Full test suite with 100% pass rate

## Quick Start

```typescript
import { AIInferenceService } from '$lib/services';
import { getAuth } from 'firebase/auth';
import Jimp from 'jimp';

// Initialize the service
const auth = getAuth();
const user = auth.currentUser;
const aiService = new AIInferenceService({ 
  user,
  functionUrl: 'https://your-project.cloudfunctions.net' // Optional
});

// Generate an image from text
const image = await aiService.textToImage({
  inputs: 'A beautiful sunset over mountains',
  parameters: { num_inference_steps: 10 }
});

// image is a JIMP object - you can manipulate it directly
console.log('Generated image:', image.getWidth(), 'x', image.getHeight());
```

## Usage Examples

### Text-to-Image Generation

```typescript
// Generate an image and get it as a JIMP object
const jimpImage = await aiService.textToImage({
  inputs: 'A cute cat sitting on a red sofa',
  parameters: {
    num_inference_steps: 10,
    guidance_scale: 7.5,
    height: 512,
    width: 512
  }
});

// Convert to various formats
const dataUrl = await ImageUtils.jimpToDataUrl(jimpImage);
const file = await ImageUtils.jimpToFile(jimpImage, 'generated.png');
```

### Image Classification

```typescript
// From a File input
const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
const file = fileInput.files[0];
const jimpImage = await ImageUtils.fileToJimp(file);

// Classify the image
const results = await aiService.imageClassification({
  inputs: jimpImage, // JIMP object or base64 string
  model: 'google/vit-base-patch16-224'
});

console.log('Top prediction:', results[0].label, results[0].score);
```

### Object Detection

```typescript
const detections = await aiService.objectDetection({
  inputs: jimpImage,
  parameters: { threshold: 0.7 }
});

detections.forEach(detection => {
  console.log(`Found: ${detection.label} (${(detection.score * 100).toFixed(1)}%)`);
  console.log(`Location: (${detection.box.xmin}, ${detection.box.ymin}) to (${detection.box.xmax}, ${detection.box.ymax})`);
});
```

### Text Processing

```typescript
// Question Answering
const answer = await aiService.questionAnswering({
  inputs: {
    question: 'What is the capital of France?',
    context: 'France is a country in Europe. Paris is the capital of France.'
  }
});

// Text Summarization
const summary = await aiService.summarization({
  inputs: 'Long text to summarize...',
  parameters: { max_length: 150 }
});

// Sentiment Analysis
const sentiment = await aiService.textClassification({
  inputs: 'I love this new AI service!',
  model: 'cardiffnlp/twitter-roberta-base-sentiment-latest'
});
```

## Image Utilities

The `ImageUtils` class provides helpful utilities for working with images:

```typescript
import { ImageUtils } from '$lib/services';

// Convert between formats
const jimpImage = await ImageUtils.fileToJimp(file);
const dataUrl = await ImageUtils.jimpToDataUrl(jimpImage);
const canvas = await ImageUtils.jimpToCanvas(jimpImage);

// Resize for AI processing
const resized = await ImageUtils.resizeForAI(jimpImage, 512, 512);

// Validate image
const validation = ImageUtils.validateImageForAI(jimpImage);
if (!validation.isValid) {
  console.warn('Image issues:', validation.issues);
  console.log('Recommendations:', validation.recommendations);
}

// Get image info
const info = ImageUtils.getImageInfo(jimpImage);
console.log(`Image: ${info.width}x${info.height}, Alpha: ${info.hasAlpha}`);
```

## Error Handling

```typescript
try {
  const result = await aiService.textToImage({ inputs: 'test prompt' });
} catch (error) {
  if (error.status === 400) {
    console.error('Bad request:', error.message);
  } else if (error.status === 503) {
    console.error('Service unavailable:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Configuration

```typescript
// Update function URL
aiService.setBaseUrl('https://new-url.cloudfunctions.net');

// Update user (useful for user switching)
aiService.updateUser(newUser);

// Get current configuration
console.log('Current URL:', aiService.getBaseUrl());
```

## Available Endpoints

### Image Processing
- `textToImage(request)` - Generate images from text prompts
- `imageClassification(request)` - Classify images into categories
- `objectDetection(request)` - Detect objects in images with bounding boxes
- `automaticSpeechRecognition(request)` - Transcribe audio to text

### Text Processing
- `textGeneration(request)` - Generate text completions
- `textClassification(request)` - Classify text (sentiment, topics, etc.)
- `tokenClassification(request)` - Named entity recognition
- `questionAnswering(request)` - Answer questions based on context
- `fillMask(request)` - Fill in masked tokens
- `summarization(request)` - Summarize long texts
- `translation(request)` - Translate between languages
- `sentenceSimilarity(request)` - Compute semantic similarity
- `conversational(request)` - Generate conversational responses
- `featureExtraction(request)` - Extract semantic features

### Utilities
- `tableQuestionAnswering(request)` - Answer questions about tabular data

## Type Safety

All methods are fully typed with TypeScript interfaces:

```typescript
import type { 
  TextToImageRequest, 
  ImageClassificationRequest,
  ClassificationResult 
} from '$lib/services';

const request: TextToImageRequest = {
  inputs: 'A beautiful landscape',
  parameters: { num_inference_steps: 10 }
};
```

## Testing

Run the test suite:

```bash
npm test src/lib/services/AIInferenceService.test.ts
```

All 22 tests should pass, covering:
- Service initialization and configuration
- All AI endpoint methods
- JIMP image handling
- Error scenarios
- Image utility functions

## Notes

- The service requires a Firebase authenticated user
- JIMP images are automatically converted to base64 for API calls
- All responses maintain full type safety
- The service handles authentication token refresh automatically
- Image validation helps optimize AI processing performance

For more examples, see `AIInferenceService.example.ts`.