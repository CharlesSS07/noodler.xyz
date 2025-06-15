import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import * as sinon from 'sinon';
import * as admin from 'firebase-admin';
import { 
  imageClassification,
  objectDetection,
  automaticSpeechRecognition,
  tableQuestionAnswering,
  textToImage
} from '../api/mediaProcessing';
import * as utils from '../api/utils';
import { createMockRequest, createMockResponse, mockDecodedToken, cleanup } from './setup';

describe('Media Processing Endpoints', () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(admin.auth(), 'verifyIdToken').resolves(mockDecodedToken);
  });

  afterEach(() => {
    sandbox.restore();
  });

  after(() => {
    cleanup();
  });

  describe('imageClassification', () => {
    it('should classify image successfully', async () => {
      const mockHFResponse = { 
        data: [
          { label: 'cat', score: 0.999 },
          { label: 'dog', score: 0.001 }
        ], 
        status: 200 
      };
      sandbox.stub(utils, 'wrapHFResponse').resolves(mockHFResponse);
      
      const req = createMockRequest({
        inputs: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...'
      });
      const res = createMockResponse();
      
      await imageClassification(req, res);
      
      expect(res.statusCode).to.equal(200);
      expect(res.data).to.deep.equal([
        { label: 'cat', score: 0.999 },
        { label: 'dog', score: 0.001 }
      ]);
    });

    it('should return error for missing inputs', async () => {
      const req = createMockRequest({});
      const res = createMockResponse();
      
      await imageClassification(req, res);
      
      expect(res.statusCode).to.equal(400);
      expect(res.data.error).to.equal('Missing inputs field (base64 image or image URL)');
    });

    it('should handle HuggingFace API errors', async () => {
      const error: any = new Error('Model not found');
      error.response = { status: 404 };
      sandbox.stub(utils, 'wrapHFResponse').rejects(error);
      
      const req = createMockRequest({
        inputs: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...'
      });
      const res = createMockResponse();
      
      await imageClassification(req, res);
      
      expect(res.statusCode).to.equal(404);
      expect(res.data.error).to.equal('Model not found');
    });
  });

  describe('objectDetection', () => {
    it('should detect objects successfully', async () => {
      const mockHFResponse = { 
        data: [
          {
            score: 0.999,
            label: 'person',
            box: { xmin: 123, ymin: 456, xmax: 789, ymax: 1012 }
          },
          {
            score: 0.845,
            label: 'car',
            box: { xmin: 50, ymin: 100, xmax: 300, ymax: 400 }
          }
        ], 
        status: 200 
      };
      sandbox.stub(utils, 'wrapHFResponse').resolves(mockHFResponse);
      
      const req = createMockRequest({
        inputs: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...',
        parameters: { threshold: 0.7 }
      });
      const res = createMockResponse();
      
      await objectDetection(req, res);
      
      expect(res.statusCode).to.equal(200);
      expect(res.data).to.have.length(2);
      expect(res.data[0].label).to.equal('person');
      expect(res.data[1].label).to.equal('car');
    });

    it('should use default threshold parameter', async () => {
      const makeRequestStub = sandbox.stub(utils, 'wrapHFResponse').resolves({ 
        data: [], 
        status: 200 
      });
      
      const req = createMockRequest({
        inputs: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...'
      });
      const res = createMockResponse();
      
      await objectDetection(req, res);
      
      expect(makeRequestStub.calledOnce).to.be.true;
    });

    it('should return error for missing inputs', async () => {
      const req = createMockRequest({});
      const res = createMockResponse();
      
      await objectDetection(req, res);
      
      expect(res.statusCode).to.equal(400);
      expect(res.data.error).to.equal('Missing inputs field (base64 image or image URL)');
    });
  });

  describe('automaticSpeechRecognition', () => {
    it('should transcribe audio successfully', async () => {
      const mockHFResponse = { 
        data: { text: 'Hello, this is a test audio file.' }, 
        status: 200 
      };
      sandbox.stub(utils, 'wrapHFResponse').resolves(mockHFResponse);
      
      const req = createMockRequest({
        inputs: 'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ4AAAC...'
      });
      const res = createMockResponse();
      
      await automaticSpeechRecognition(req, res);
      
      expect(res.statusCode).to.equal(200);
      expect(res.data.text).to.equal('Hello, this is a test audio file.');
    });

    it('should return error for missing inputs', async () => {
      const req = createMockRequest({});
      const res = createMockResponse();
      
      await automaticSpeechRecognition(req, res);
      
      expect(res.statusCode).to.equal(400);
      expect(res.data.error).to.equal('Missing inputs field (base64 audio data)');
    });

    it('should handle authentication errors', async () => {
      sandbox.restore();
      sandbox.stub(admin.auth(), 'verifyIdToken').rejects(new Error('Token expired'));
      
      const req = createMockRequest({
        inputs: 'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ4AAAC...'
      });
      const res = createMockResponse();
      
      await automaticSpeechRecognition(req, res);
      
      expect(res.statusCode).to.equal(500);
      expect(res.data.error).to.equal('Token expired');
    });
  });

  describe('tableQuestionAnswering', () => {
    it('should answer table questions successfully', async () => {
      const mockHFResponse = { 
        data: {
          answer: '36542',
          coordinates: [[0, 1]],
          cells: ['36542'],
          aggregator: 'NONE'
        }, 
        status: 200 
      };
      sandbox.stub(utils, 'wrapHFResponse').resolves(mockHFResponse);
      
      const req = createMockRequest({
        inputs: {
          query: 'How many stars does the transformers repository have?',
          table: {
            'Repository': ['Transformers', 'Datasets', 'Tokenizers'],
            'Stars': ['36542', '4512', '3934'],
            'Contributors': ['651', '77', '34']
          }
        }
      });
      const res = createMockResponse();
      
      await tableQuestionAnswering(req, res);
      
      expect(res.statusCode).to.equal(200);
      expect(res.data.answer).to.equal('36542');
      expect(res.data.coordinates).to.deep.equal([[0, 1]]);
    });

    it('should return error for missing query', async () => {
      const req = createMockRequest({
        inputs: {
          table: {
            'Repository': ['Transformers'],
            'Stars': ['36542']
          }
        }
      });
      const res = createMockResponse();
      
      await tableQuestionAnswering(req, res);
      
      expect(res.statusCode).to.equal(400);
      expect(res.data.error).to.equal('Missing inputs.query or inputs.table');
    });

    it('should return error for missing table', async () => {
      const req = createMockRequest({
        inputs: {
          query: 'How many stars?'
        }
      });
      const res = createMockResponse();
      
      await tableQuestionAnswering(req, res);
      
      expect(res.statusCode).to.equal(400);
      expect(res.data.error).to.equal('Missing inputs.query or inputs.table');
    });

    it('should handle malformed table data', async () => {
      const error: any = new Error('Invalid table format');
      error.response = { status: 422 };
      sandbox.stub(utils, 'wrapHFResponse').rejects(error);
      
      const req = createMockRequest({
        inputs: {
          query: 'Test query',
          table: 'invalid table format'
        }
      });
      const res = createMockResponse();
      
      await tableQuestionAnswering(req, res);
      
      expect(res.statusCode).to.equal(422);
      expect(res.data.error).to.equal('Invalid table format');
    });
  });

  describe('textToImage', () => {
    it('should generate image successfully', async () => {
      // Mock Blob response
      const mockBlob = {
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
        type: 'image/png'
      };
      const mockHFResponse = { 
        data: mockBlob, 
        status: 200 
      };
      sandbox.stub(utils, 'wrapHFResponse').resolves(mockHFResponse);
      
      const req = createMockRequest({
        inputs: 'Astronaut riding a horse',
        parameters: { num_inference_steps: 10 }
      });
      const res = createMockResponse();
      
      await textToImage(req, res);
      
      expect(res.statusCode).to.equal(200);
      expect(res.data).to.have.property('image');
      expect(res.data).to.have.property('metadata');
      expect(res.data.image).to.be.a('string');
      expect(res.data.image).to.include('data:image/png;base64,');
      expect(res.data.metadata.prompt).to.equal('Astronaut riding a horse');
      expect(res.data.metadata.parameters.num_inference_steps).to.equal(10);
    });

    it('should return error for missing inputs', async () => {
      const req = createMockRequest({});
      const res = createMockResponse();
      
      await textToImage(req, res);
      
      expect(res.statusCode).to.equal(400);
      expect(res.data.error).to.equal('Missing inputs field (text prompt)');
    });

    it('should use default parameters', async () => {
      const mockBlob = {
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(512)),
        type: 'image/jpeg'
      };
      const mockHFResponse = { 
        data: mockBlob, 
        status: 200 
      };
      sandbox.stub(utils, 'wrapHFResponse').resolves(mockHFResponse);
      
      const req = createMockRequest({
        inputs: 'Beautiful sunset over mountains'
      });
      const res = createMockResponse();
      
      await textToImage(req, res);
      
      expect(res.statusCode).to.equal(200);
      expect(res.data.metadata.parameters.num_inference_steps).to.equal(5);
      expect(res.data.image).to.include('data:image/jpeg;base64,');
    });

    it('should handle HuggingFace API errors', async () => {
      const error: any = new Error('Model loading failed');
      error.response = { status: 503 };
      sandbox.stub(utils, 'wrapHFResponse').rejects(error);
      
      const req = createMockRequest({
        inputs: 'Test prompt'
      });
      const res = createMockResponse();
      
      await textToImage(req, res);
      
      expect(res.statusCode).to.equal(503);
      expect(res.data.error).to.equal('Model loading failed');
    });

    it('should handle authentication errors', async () => {
      sandbox.restore();
      sandbox.stub(admin.auth(), 'verifyIdToken').rejects(new Error('Invalid token'));
      
      const req = createMockRequest({
        inputs: 'Test prompt'
      });
      const res = createMockResponse();
      
      await textToImage(req, res);
      
      expect(res.statusCode).to.equal(500);
      expect(res.data.error).to.equal('Invalid token');
    });
  });
});