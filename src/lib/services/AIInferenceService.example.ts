/**
 * Example usage of the AIInferenceService with JIMP images
 * This file demonstrates how to use the service for various AI tasks
 */

import {AIInferenceService, type DetectionResult, ImageUtils} from './index';
import type { User } from 'firebase/auth';
import {Jimp, type JimpInstance} from 'jimp';

export class AIInferenceExamples {
  private aiService: AIInferenceService;

  constructor(user: User, functionUrl?: string) {
    this.aiService = new AIInferenceService({ 
      user, 
      functionUrl: functionUrl || 'https://us-central1-your-project-id.cloudfunctions.net'
    });
  }

  /**
   * Example: Generate an image from text and return as JIMP
   */
  async generateImageExample(): Promise<JimpInstance> {
    try {
      const generatedImage = await this.aiService.textToImage({
        inputs: 'A beautiful sunset over mountains with a lake in the foreground',
        parameters: {
          num_inference_steps: 10,
          guidance_scale: 7.5
        }
      });

      console.log('Generated image dimensions:', {
        width: generatedImage.width,
        height: generatedImage.height
      });

      return generatedImage;
    } catch (error) {
      console.error('Image generation failed:', error);
      throw error;
    }
  }

  /**
   * Example: Classify an image using JIMP input
   */
  async classifyImageExample(imageFile: File): Promise<void> {
    try {
      // Convert File to JIMP
      const jimpImage = await ImageUtils.fileToJimp(imageFile);

      // Optional: Resize for faster processing
      const resizedImage = await ImageUtils.resizeIfTooLarge(jimpImage, 512, 512);

      // Classify the image
      const results = await this.aiService.imageClassification({
        inputs: resizedImage,
        model: 'google/vit-base-patch16-224'
      });

      console.log('Classification results:', results);
      
      // Display top result
      if (results.length > 0) {
        console.log(`Top prediction: ${results[0].label} (${(results[0].score * 100).toFixed(1)}%)`);
      }
    } catch (error) {
      console.error('Image classification failed:', error);
    }
  }

  /**
   * Example: Object detection on an image
   */
  async detectObjectsExample(jimpImage: JimpInstance): Promise<DetectionResult[]> {
    try {
      const results = await this.aiService.objectDetection({
        inputs: jimpImage,
        parameters: { threshold: 0.7 }
      });

      console.log('Detected objects:', results);
      
      // Draw bounding boxes on the image (example)
      const annotatedImage = jimpImage.clone();
      results.forEach((detection, index) => {
        console.log(`Object ${index + 1}: ${detection.label} (${(detection.score * 100).toFixed(1)}%)`);
        console.log(`Location: x=${detection.box.xmin}-${detection.box.xmax}, y=${detection.box.ymin}-${detection.box.ymax}`);
      });

      return results;
    } catch (error) {
      console.error('Object detection failed:', error);
      throw error;
    }
  }

  /**
   * Example: Process text with various NLP tasks
   */
  async processTextExample(): Promise<void> {
    const text = "The quick brown fox jumps over the lazy dog. This is a sample text for testing various NLP capabilities.";

    try {
      // Text classification
      const sentiment = await this.aiService.textClassification({
        inputs: "I love this new AI service! It's amazing!",
        model: 'cardiffnlp/twitter-roberta-base-sentiment-latest'
      });
      console.log('Sentiment analysis:', sentiment);

      // Question answering
      const qaResult = await this.aiService.questionAnswering({
        inputs: {
          question: "What animal jumps?",
          context: text
        }
      });
      console.log('Question answering:', qaResult);

      // Text summarization
      const summary = await this.aiService.summarization({
        inputs: "The field of artificial intelligence has evolved rapidly in recent years. Machine learning techniques have become more sophisticated, enabling computers to perform tasks that were previously thought to be impossible. Deep learning, in particular, has revolutionized areas such as computer vision, natural language processing, and speech recognition.",
        parameters: { max_length: 50 }
      });
      console.log('Summary:', summary);

      // Feature extraction
      const features = await this.aiService.featureExtraction({
        inputs: "This is a test sentence for feature extraction."
      });
      console.log('Text features shape:', features.length, 'x', features[0]?.length);

    } catch (error) {
      console.error('Text processing failed:', error);
    }
  }

  /**
   * Example: Complete workflow - generate image, then classify it
   */
  async completeWorkflowExample(): Promise<void> {
    try {
      console.log('Step 1: Generating image...');
      const generatedImage = await this.aiService.textToImage({
        inputs: 'A cute cat sitting on a red sofa',
        parameters: { num_inference_steps: 5 }
      });

      console.log('Step 2: Classifying generated image...');
      const classification = await this.aiService.imageClassification({
        inputs: generatedImage
      });

      console.log('Workflow complete!');
      console.log('Generated image size:', generatedImage.width, 'x', generatedImage.height);
      console.log('Top classification:', classification[0]);

      // Optional: Save the image
      const imageBuffer = await ImageUtils.jimpToFile(generatedImage, 'generated-cat.png');
      console.log('Image saved as File object:', imageBuffer.name);

    } catch (error) {
      console.error('Complete workflow failed:', error);
    }
  }

  /**
   * Example: Working with different image formats
   */
  async imageFormatExample(): Promise<void> {
    try {
      // Create a simple test image
      const testImage = new Jimp(256, 256, 0xFF0000FF); // Red square
      
      // Validate the image for AI processing
      const validation = ImageUtils.validateImageForAI(testImage);
      console.log('Image validation:', validation);

      // Convert to various formats
      const dataUrl = await ImageUtils.jimpToDataUrl(testImage);
      console.log('Data URL length:', dataUrl.length);

      const file = await ImageUtils.jimpToFile(testImage, 'test.png');
      console.log('File created:', file.name, file.size, 'bytes');

      // Resize for AI processing
      const resized = await ImageUtils.resizeIfTooLarge(testImage, 128, 128);
      console.log('Resized dimensions:', resized.getWidth(), 'x', resized.getHeight());

    } catch (error) {
      console.error('Image format example failed:', error);
    }
  }

  /**
   * Example: Error handling
   */
  async errorHandlingExample(): Promise<void> {
    try {
      // This should fail due to missing inputs
      await this.aiService.textToImage({ inputs: '' });
    } catch (error) {
      if (error instanceof Error) {
        console.log('Caught expected error:', error.message);
        
        // Check if it's an AI inference error with additional details
        const aiError = error as any;
        if (aiError.status) {
          console.log('Error status:', aiError.status);
          console.log('Error response:', aiError.response);
        }
      }
    }
  }

  /**
   * Example: Batch processing multiple images
   */
  async batchProcessingExample(imageFiles: File[]): Promise<void> {
    console.log(`Processing ${imageFiles.length} images...`);
    
    const results = await Promise.allSettled(
      imageFiles.map(async (file, index) => {
        console.log(`Processing image ${index + 1}/${imageFiles.length}: ${file.name}`);
        
        const jimpImage = await ImageUtils.fileToJimp(file);
        const classification = await this.aiService.imageClassification({
          inputs: jimpImage
        });
        
        return {
          filename: file.name,
          classification: classification[0]
        };
      })
    );

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`${result.value.filename}: ${result.value.classification.label} (${(result.value.classification.score * 100).toFixed(1)}%)`);
      } else {
        console.error(`Error processing image ${index + 1}:`, result.reason);
      }
    });
  }
}

// Usage example:
/*
import { getAuth } from 'firebase/auth';
import { AIInferenceExamples } from './AIInferenceService.example';

async function runExamples() {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (user) {
    const examples = new AIInferenceExamples(user);
    
    // Run a simple example
    await examples.generateImageExample();
    await examples.processTextExample();
  }
}
*/