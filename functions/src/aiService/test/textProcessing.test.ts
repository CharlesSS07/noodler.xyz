import {expect} from "chai";
import {describe, it, beforeEach, afterEach} from "mocha";
import * as sinon from "sinon";
import * as admin from "firebase-admin";
import {
  textGeneration,
  textClassification,
  tokenClassification,
  questionAnswering,
  fillMask,
  summarization,
  translation,
  sentenceSimilarity,
  conversational,
  featureExtraction,
} from "../api/textProcessing";
import * as utils from "../api/utils";
import {
  createMockRequest,
  createMockResponse,
  mockDecodedToken,
  cleanup,
} from "./setup";

describe("Text Processing Endpoints", () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(admin.auth(), "verifyIdToken").resolves(mockDecodedToken);
  });

  afterEach(() => {
    sandbox.restore();
  });

  after(() => {
    cleanup();
  });

  describe("textGeneration", () => {
    it("should generate text successfully", async () => {
      const mockHFResponse = [{generated_text: "Generated text"}];
      const mockClient = {
        textGeneration: sandbox.stub().resolves(mockHFResponse),
      };
      sandbox.stub(utils, "getHFClient").returns(mockClient as any);

      const req = createMockRequest({
        inputs: "Test prompt",
        parameters: {max_length: 100},
      });
      const res = createMockResponse();

      await textGeneration(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.data).to.deep.equal([
        {generated_text: "Generated text"},
      ]);
    });

    it("should return error for missing inputs", async () => {
      const req = createMockRequest({});
      const res = createMockResponse();

      await textGeneration(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.data.error).to.equal("Missing inputs field");
    });

    it("should handle authentication errors", async () => {
      sandbox.restore();
      sandbox
        .stub(admin.auth(), "verifyIdToken")
        .rejects(new Error("Invalid token"));

      const req = createMockRequest({inputs: "Test prompt"});
      const res = createMockResponse();

      await textGeneration(req, res);

      expect(res.statusCode).to.equal(500);
      expect(res.data.error).to.equal("Invalid token");
    });
  });

  describe("textClassification", () => {
    it("should classify text successfully", async () => {
      const mockHFResponse = {
        data: [[{label: "POSITIVE", score: 0.999}]],
        status: 200,
      };
      sandbox.stub(utils, "wrapHFResponse").resolves(mockHFResponse);

      const req = createMockRequest({
        inputs: "I love this product!",
      });
      const res = createMockResponse();

      await textClassification(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.data).to.deep.equal([
        [{label: "POSITIVE", score: 0.999}],
      ]);
    });

    it("should return error for missing inputs", async () => {
      const req = createMockRequest({});
      const res = createMockResponse();

      await textClassification(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.data.error).to.equal("Missing inputs field");
    });
  });

  describe("tokenClassification", () => {
    it("should perform NER successfully", async () => {
      const mockHFResponse = {
        data: [
          {
            entity_group: "PER",
            score: 0.999,
            word: "John",
            start: 0,
            end: 4,
          },
        ],
        status: 200,
      };
      sandbox.stub(utils, "wrapHFResponse").resolves(mockHFResponse);

      const req = createMockRequest({
        inputs: "John works at Microsoft",
      });
      const res = createMockResponse();

      await tokenClassification(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.data).to.deep.equal([
        {
          entity_group: "PER",
          score: 0.999,
          word: "John",
          start: 0,
          end: 4,
        },
      ]);
    });
  });

  describe("questionAnswering", () => {
    it("should answer questions successfully", async () => {
      const mockHFResponse = {
        data: {answer: "Paris", score: 0.999, start: 25, end: 30},
        status: 200,
      };
      sandbox.stub(utils, "wrapHFResponse").resolves(mockHFResponse);

      const req = createMockRequest({
        inputs: {
          question: "What is the capital of France?",
          context:
                        "France is a country. Paris is the capital of France.",
        },
      });
      const res = createMockResponse();

      await questionAnswering(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.data.answer).to.equal("Paris");
    });

    it("should return error for missing question or context", async () => {
      const req = createMockRequest({
        inputs: {question: "What is the capital?"},
      });
      const res = createMockResponse();

      await questionAnswering(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.data.error).to.equal(
        "Missing inputs.question or inputs.context"
      );
    });
  });

  describe("fillMask", () => {
    it("should fill mask successfully", async () => {
      const mockHFResponse = {
        data: [
          {
            score: 0.123,
            token: 2204,
            token_str: "nice",
            sequence: "the weather is nice.",
          },
        ],
        status: 200,
      };
      sandbox.stub(utils, "wrapHFResponse").resolves(mockHFResponse);

      const req = createMockRequest({
        inputs: "The weather is [MASK].",
      });
      const res = createMockResponse();

      await fillMask(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.data[0].token_str).to.equal("nice");
    });

    it("should return error for missing MASK token", async () => {
      const req = createMockRequest({
        inputs: "The weather is nice.",
      });
      const res = createMockResponse();

      await fillMask(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.data.error).to.equal(
        "Missing inputs or [MASK] token not found"
      );
    });
  });

  describe("summarization", () => {
    it("should summarize text successfully", async () => {
      const mockHFResponse = {
        data: [{summary_text: "This is a summary."}],
        status: 200,
      };
      sandbox.stub(utils, "wrapHFResponse").resolves(mockHFResponse);

      const req = createMockRequest({
        inputs:
          "This is a very long text that needs to be summarized " +
          "into a shorter version.",
      });
      const res = createMockResponse();

      await summarization(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.data[0].summary_text).to.equal("This is a summary.");
    });
  });

  describe("translation", () => {
    it("should translate text successfully", async () => {
      const mockHFResponse = {
        data: [{translation_text: "Bonjour le monde"}],
        status: 200,
      };
      sandbox.stub(utils, "wrapHFResponse").resolves(mockHFResponse);

      const req = createMockRequest({
        inputs: "Hello world",
      });
      const res = createMockResponse();

      await translation(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.data[0].translation_text).to.equal("Bonjour le monde");
    });
  });

  describe("sentenceSimilarity", () => {
    it("should compute sentence similarity successfully", async () => {
      const mockHFResponse = {
        data: [0.945, 0.234, 0.678],
        status: 200,
      };
      sandbox.stub(utils, "wrapHFResponse").resolves(mockHFResponse);

      const req = createMockRequest({
        inputs: {
          source_sentence: "That is a happy person",
          sentences: [
            "That is a very happy person",
            "That is a sad person",
            "Today is sunny",
          ],
        },
      });
      const res = createMockResponse();

      await sentenceSimilarity(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.data).to.deep.equal([0.945, 0.234, 0.678]);
    });

    it("should return error for missing source_sentence or sentences",
      async () => {
        const req = createMockRequest({
          inputs: {source_sentence: "Test sentence"},
        });
        const res = createMockResponse();

        await sentenceSimilarity(req, res);

        expect(res.statusCode).to.equal(400);
        expect(res.data.error).to.equal(
          "Missing inputs.source_sentence or inputs.sentences"
        );
      });
  });

  describe("conversational", () => {
    it("should generate conversational response successfully", async () => {
      const mockHFResponse = {
        data: {generated_text: "That sounds interesting!"},
        status: 200,
      };
      sandbox.stub(utils, "wrapHFResponse").resolves(mockHFResponse);

      const req = createMockRequest({
        inputs: {
          text: "Tell me about your day",
          past_user_inputs: [],
          generated_responses: [],
        },
      });
      const res = createMockResponse();

      await conversational(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.data.generated_text).to.equal(
        "That sounds interesting!"
      );
    });

    it("should return error for missing text field", async () => {
      const req = createMockRequest({
        inputs: {past_user_inputs: []},
      });
      const res = createMockResponse();

      await conversational(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.data.error).to.equal("Missing inputs.text field");
    });
  });

  describe("featureExtraction", () => {
    it("should extract features successfully", async () => {
      const mockHFResponse = {
        data: [[0.123, -0.456, 0.789]],
        status: 200,
      };
      sandbox.stub(utils, "wrapHFResponse").resolves(mockHFResponse);

      const req = createMockRequest({
        inputs: "This is a test sentence.",
      });
      const res = createMockResponse();

      await featureExtraction(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.data).to.deep.equal([[0.123, -0.456, 0.789]]);
    });
  });
});
