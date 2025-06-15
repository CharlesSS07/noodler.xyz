import { expect } from 'chai';
import { describe, it } from 'mocha';
import { getHFClient, wrapHFResponse } from '../api/utils';

describe('Working HuggingFace API Integration Tests', () => {
  // These tests use models that are confirmed to work with the HuggingFace Inference API

  describe('Question Answering', () => {
    it('should perform question answering with real API', async function() {
      this.timeout(30000);
      
      const client = getHFClient();
      const result = await wrapHFResponse(
        client.questionAnswering({
          model: 'deepset/roberta-base-squad2',
          inputs: {
            question: 'What is the capital of France?',
            context: 'France is a country in Europe. The capital of France is Paris. It is known for the Eiffel Tower.'
          }
        })
      );
      
      expect(result.status).to.equal(200);
      expect(result.data).to.have.property('answer');
      expect(result.data).to.have.property('score');
      expect(result.data.answer).to.be.a('string');
      expect(result.data.answer.toLowerCase()).to.include('paris');
      expect(result.data.score).to.be.a('number');
      expect(result.data.score).to.be.greaterThan(0);
      
      console.log('QA Result:', result.data);
    });

    it('should handle complex question answering', async function() {
      this.timeout(30000);
      
      const client = getHFClient();
      const result = await wrapHFResponse(
        client.questionAnswering({
          model: 'deepset/roberta-base-squad2',
          inputs: {
            question: 'When was the company founded?',
            context: 'TechCorp was founded in 1995 by two college friends. The company started as a small software development firm and has grown to become a major player in the tech industry.'
          }
        })
      );
      
      expect(result.status).to.equal(200);
      expect(result.data).to.have.property('answer');
      expect(result.data.answer).to.be.a('string');
      expect(result.data.answer).to.include('1995');
      
      console.log('Complex QA Result:', result.data);
    });
  });

  describe('Fill Mask', () => {
    it('should perform fill mask with real API', async function() {
      this.timeout(30000);
      
      const client = getHFClient();
      const result = await wrapHFResponse(
        client.fillMask({
          model: 'bert-base-uncased',
          inputs: 'The weather is [MASK] today.'
        })
      );
      
      expect(result.status).to.equal(200);
      expect(result.data).to.be.an('array');
      expect(result.data.length).to.be.greaterThan(0);
      expect(result.data[0]).to.have.property('token_str');
      expect(result.data[0]).to.have.property('score');
      expect(result.data[0].token_str).to.be.a('string');
      expect(result.data[0].score).to.be.a('number');
      
      console.log('Fill Mask Result:', result.data.slice(0, 3));
    });
  });

  describe('Sentence Similarity', () => {
    it('should compute sentence similarity with real API', async function() {
      this.timeout(30000);
      
      const client = getHFClient();
      const result = await wrapHFResponse(
        client.sentenceSimilarity({
          model: 'sentence-transformers/all-MiniLM-L6-v2',
          inputs: {
            source_sentence: 'I love programming',
            sentences: ['I enjoy coding', 'I hate vegetables', 'Programming is fun']
          }
        })
      );
      
      expect(result.status).to.equal(200);
      expect(result.data).to.be.an('array');
      expect(result.data.length).to.equal(3);
      expect(result.data[0]).to.be.a('number');
      expect(result.data[0]).to.be.greaterThan(result.data[1]); // Should be more similar to first sentence
      
      console.log('Similarity Scores:', result.data);
    });
  });

  describe('Zero-shot Classification', () => {
    it('should perform zero-shot classification with real API', async function() {
      this.timeout(30000);
      
      const client = getHFClient();
      const result = await wrapHFResponse(
        client.zeroShotClassification({
          model: 'facebook/bart-large-mnli',
          inputs: 'I love this movie, it was fantastic!',
          parameters: {
            candidate_labels: ['positive', 'negative', 'neutral']
          }
        })
      );
      
      expect(result.status).to.equal(200);
      // Handle different response formats
      if (Array.isArray(result.data)) {
        expect(result.data[0]).to.have.property('labels');
        expect(result.data[0]).to.have.property('scores');
        expect(result.data[0].labels).to.be.an('array');
        expect(result.data[0].scores).to.be.an('array');
        console.log('Zero-shot Classification (array):', result.data);
      } else {
        expect(result.data).to.have.property('labels');
        expect(result.data).to.have.property('scores');
        expect(result.data.labels).to.be.an('array');
        expect(result.data.scores).to.be.an('array');
        console.log('Zero-shot Classification (object):', result.data);
      }
    });
  });

  describe('Text Summarization', () => {
    it('should perform text summarization with real API', async function() {
      this.timeout(45000); // Longer timeout for summarization
      
      const longText = `
        The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars in Paris, France. 
        It is named after the engineer Gustave Eiffel, whose company designed and built the tower. 
        Constructed from 1887 to 1889 as the entrance to the 1889 World's Fair, it was initially 
        criticized by some of France's leading artists and intellectuals for its design, but it 
        has become a global cultural icon of France and one of the most recognizable structures 
        in the world. The tower is 330 metres (1,083 ft) tall, about the same height as an 
        81-storey building, and the tallest structure in Paris.
      `;
      
      const client = getHFClient();
      const result = await wrapHFResponse(
        client.summarization({
          model: 'facebook/bart-large-cnn',
          inputs: longText,
          parameters: { max_length: 100 }
        })
      );
      
      expect(result.status).to.equal(200);
      // Response can be either array or object depending on model
      if (Array.isArray(result.data)) {
        expect(result.data[0]).to.have.property('summary_text');
        expect(result.data[0].summary_text).to.be.a('string');
        expect(result.data[0].summary_text.length).to.be.lessThan(longText.length);
        console.log('Summary:', result.data[0].summary_text);
      } else {
        expect(result.data).to.have.property('summary_text');
        expect(result.data.summary_text).to.be.a('string');
        expect(result.data.summary_text.length).to.be.lessThan(longText.length);
        console.log('Summary:', result.data.summary_text);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle model loading state gracefully', async function() {
      this.timeout(30000);
      
      try {
        // This might return model loading error or 404
        const client = getHFClient();
        await wrapHFResponse(
          client.textGeneration({
            model: 'non-existent-model-12345',
            inputs: 'test'
          })
        );
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error).to.exist;
        expect(error.response?.status).to.be.oneOf([404, 500, 503]);
        console.log('Expected error for non-existent model:', error.response?.status);
      }
    });
  });

  describe('Text to Image', () => {
    it.skip('should generate image with real API', async function() {
      this.timeout(120000); // Very long timeout for image generation
      
      const client = getHFClient();
      const result = await wrapHFResponse(
        client.textToImage({
          provider: 'hf-inference',
          model: 'black-forest-labs/FLUX.1-dev',
          inputs: 'A cute cat sitting on a red couch',
          parameters: { 
            num_inference_steps: 5 // Faster generation for testing
          }
        })
      );
      
      expect(result.status).to.equal(200);
      expect(result.data).to.be.instanceOf(Blob);
      expect(result.data.type).to.include('image');
      expect(result.data.size).to.be.greaterThan(0);
      
      console.log('Image generated successfully:', {
        type: result.data.type,
        size: result.data.size
      });
    });
  });
});