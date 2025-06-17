import {expect} from "chai";
import {describe, it, beforeEach, afterEach} from "mocha";
import * as sinon from "sinon";
import * as admin from "firebase-admin";

// Text Processing Endpoints
import {
  textClassification,
  questionAnswering,
  fillMask,
  summarization,
  translation,
  conversational,
  featureExtraction,
} from "../api/textProcessing";

// Media Processing Endpoints
import {
  imageClassification,
  objectDetection,
  automaticSpeechRecognition,
  tableQuestionAnswering,
  textToImage,
} from "../api/mediaProcessing";

import {
  createMockRequest,
  createMockResponse,
  mockDecodedToken,
  cleanup,
} from "./setup";

describe("HuggingFace API Real Integration Tests", () => {
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

  describe("Text Processing Endpoints", () => {
    describe("textClassification", () => {
      it("should classify sentiment successfully with real API", async () => {
        const req = createMockRequest({
          inputs: "I like you. I love you",
          model: "distilbert-base-uncased-finetuned-sst-2-english",
        });
        const res = createMockResponse();

        await textClassification(req, res);

        expect(res.statusCode).to.equal(200);
        expect(res.data).to.be.an("array");
        expect(res.data[0]).to.have.property("label");
        expect(res.data[0]).to.have.property("score");
        expect(["POSITIVE", "NEGATIVE"]).to.include(res.data[0].label);
        expect(res.data[0].score).to.be.above(0.5);
      }).timeout(120000);

      it("should return error for missing inputs", async () => {
        const req = createMockRequest({});
        const res = createMockResponse();

        await textClassification(req, res);

        expect(res.statusCode).to.equal(400);
        expect(res.data.error).to.equal("Missing inputs field");
      });
    });

    describe("questionAnswering", () => {
      it("should answer questions from context with real API", async () => {
        const req = createMockRequest({
          inputs: {
            question: "What is my name?",
            context: "My name is Clara and I live in Berkeley.",
          },
          model: "deepset/roberta-base-squad2",
        });
        const res = createMockResponse();

        await questionAnswering(req, res);

        expect(res.statusCode).to.equal(200);
        expect(res.data).to.have.property("answer");
        expect(res.data).to.have.property("score");
        expect(res.data.answer).to.equal("Clara");
        expect(res.data.score).to.be.above(0.5);
      }).timeout(120000);

      it("should return error for missing question or context", async () => {
        const req = createMockRequest({
          inputs: {question: "What is this?"},
        });
        const res = createMockResponse();

        await questionAnswering(req, res);

        expect(res.statusCode).to.equal(400);
        expect(res.data.error).to.equal("Missing inputs.question or inputs.context");
      });
    });

    describe("fillMask", () => {
      it("should predict masked tokens with real API", async () => {
        const req = createMockRequest({
          inputs: "The answer to the [MASK] is simple.",
          model: "google-bert/bert-base-uncased",
        });
        const res = createMockResponse();

        await fillMask(req, res);

        expect(res.statusCode).to.equal(200);
        expect(res.data).to.be.an("array");
        expect(res.data[0]).to.have.property("token_str");
        expect(res.data[0]).to.have.property("score");
        expect(res.data[0]).to.have.property("sequence");
        expect(res.data[0].sequence).to.include(res.data[0].token_str);
      }).timeout(120000);

      it("should return error for missing MASK token", async () => {
        const req = createMockRequest({inputs: "No mask token here"});
        const res = createMockResponse();

        await fillMask(req, res);

        expect(res.statusCode).to.equal(400);
        expect(res.data.error).to.equal("Missing inputs or [MASK] token not found");
      });
    });

    describe("summarization", () => {
      it("should summarize long text with real API", async () => {
        const req = createMockRequest({
          inputs: "My name is chuck. The tower is 324 metres (1,063 ft) tall, about the same height as an 81-storey building, and the tallest structure in Paris. Its base is square, measuring 125 metres (410 ft) on each side. During its construction, the Eiffel Tower surpassed the Washington Monument to become the tallest man-made structure in the world, a title it held for 41 years until the Chrysler Building in New York City was finished in 1930. It was the first structure to reach a height of 300 metres. Due to the addition of a broadcasting aerial at the top of the tower in 1957, it is now taller than the Chrysler Building by 5.2 metres (17 ft). Excluding transmitters, the Eiffel Tower is the second tallest free-standing structure in France after the Millau Viaduct.",
          model: "facebook/bart-large-cnn",
        });
        const res = createMockResponse();

        await summarization(req, res);

        expect(res.statusCode).to.equal(200);
        if (Array.isArray(res.data)) {
          expect(res.data[0]).to.have.property("summary_text");
          expect(res.data[0].summary_text).to.be.a("string");
          expect(res.data[0].summary_text.length).to.be.below(req.body.inputs.length);
          expect(res.data[0].summary_text.toLowerCase()).to.not.include("chuck");
        } else {
          expect(res.data).to.have.property("summary_text");
          expect(res.data.summary_text).to.be.a("string");
          expect(res.data.summary_text.length).to.be.below(req.body.inputs.length);
          expect(res.data.summary_text.toLowerCase()).to.not.include("chuck");
        }
      }).timeout(15000);
    });

    describe("translation", () => {
      it("should translate Russian to English with real API", async () => {
        const req = createMockRequest({
          inputs: "Меня зовут Вольфганг и я живу в Берлине",
          model: "Helsinki-NLP/opus-mt-ru-en",
        });
        const res = createMockResponse();

        await translation(req, res);

        expect(res.statusCode).to.equal(200);
        if (Array.isArray(res.data)) {
          expect(res.data[0]).to.have.property("translation_text");
          expect(res.data[0].translation_text).to.include("Wolfgang");
          expect(res.data[0].translation_text).to.include("Berlin");
        } else {
          expect(res.data).to.have.property("translation_text");
          expect(res.data.translation_text).to.include("Wolfgang");
          expect(res.data.translation_text).to.include("Berlin");
        }
      }).timeout(10000);
    });

    describe("featureExtraction", () => {
      it("should extract text embeddings with real API", async () => {
        const req = createMockRequest({
          inputs: "Today is a sunny day and I will get some ice cream.",
          model: "intfloat/multilingual-e5-large-instruct",
        });
        const res = createMockResponse();

        await featureExtraction(req, res);

        expect(res.statusCode).to.equal(200);
        if (Array.isArray(res.data)) {
          if (Array.isArray(res.data[0])) {
            expect(res.data[0]).to.have.length.above(100);
            expect(res.data[0][0]).to.be.a("number");
          } else {
            expect(res.data).to.have.length.above(100);
            expect(res.data[0]).to.be.a("number");
          }
        } else {
          expect(res.data).to.be.a("number");
        }
      }).timeout(10000);
    });

    describe("conversational", () => {
      it("should generate conversational responses with real API", async () => {
        // Note: microsoft/DialoGPT-medium has no inference provider available
        const req = createMockRequest({
          inputs: {
            text: "Hello there!",
            past_user_inputs: [],
            generated_responses: [],
          },
        });
        const res = createMockResponse();

        await conversational(req, res);

        expect(res.statusCode).to.equal(200);
        expect(res.data).to.have.property("generated_text");
        expect(res.data.generated_text).to.be.a("string");
        expect(res.data.generated_text.length).to.be.above(0);
      }).timeout(15000);

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
  });

  describe("Media Processing Endpoints", () => {
    describe("imageClassification", () => {
      it("should classify dog breed from image URL with real API", async () => {
        // Note: Image URL inference has content type issues
        const req = createMockRequest({
          inputs: "https://picsum.photos/id/237/200/300", // Dog image URL from examples
          model: "skyau/dog-breed-classifier-vit",
        });
        const res = createMockResponse();

        await imageClassification(req, res);

        expect(res.statusCode).to.equal(200);
        expect(res.data).to.be.an("array");
        expect(res.data[0]).to.have.property("label");
        expect(res.data[0]).to.have.property("score");
        expect(res.data[0].label).to.include("retriever"); // Should detect some retriever breed
        expect(res.data[0].score).to.be.above(0.1);
      }).timeout(15000);

      it("should return error for missing inputs", async () => {
        const req = createMockRequest({});
        const res = createMockResponse();

        await imageClassification(req, res);

        expect(res.statusCode).to.equal(400);
        expect(res.data.error).to.equal("Missing inputs field (base64 image or image URL)");
      });
    });

    describe("objectDetection", () => {
      it("should detect objects in image with real API", async () => {
        // Note: Object detection has deserialization issues
        const req = createMockRequest({
          inputs: "https://picsum.photos/id/237/200/300",
          model: "facebook/detr-resnet-50",
        });
        const res = createMockResponse();

        await objectDetection(req, res);

        expect(res.statusCode).to.equal(200);
        expect(res.data).to.be.an("array");
        if (res.data.length > 0) {
          expect(res.data[0]).to.have.property("label");
          expect(res.data[0]).to.have.property("score");
          expect(res.data[0]).to.have.property("box");
          expect(res.data[0].box).to.have.all.keys("xmin", "ymin", "xmax", "ymax");
          expect(res.data[0].label).to.include("dog"); // Should detect dog
        }
      }).timeout(15000);
    });

    describe("tableQuestionAnswering", () => {
      it("should answer questions about tabular data with real API", async () => {
        const req = createMockRequest({
          inputs: {
            query: "How many stars does the transformers repository have?",
            table: {
              "Repository": ["Transformers", "Datasets", "Tokenizers"],
              "Stars": ["36542", "4512", "3934"],
              "Contributors": ["651", "77", "34"],
              "Programming language": ["Python", "Python", "Rust, Python and NodeJS"],
            },
          },
          model: "google/tapas-base-finetuned-wtq",
        });
        const res = createMockResponse();

        await tableQuestionAnswering(req, res);

        expect(res.statusCode).to.equal(200);
        expect(res.data).to.have.property("answer");
        expect(res.data.answer).to.include("36542");
      }).timeout(15000);

      it("should return error for missing query or table", async () => {
        const req = createMockRequest({
          inputs: {query: "What is this?"},
        });
        const res = createMockResponse();

        await tableQuestionAnswering(req, res);

        expect(res.statusCode).to.equal(400);
        expect(res.data.error).to.equal("Missing inputs.query or inputs.table");
      });
    });

    describe("textToImage", () => {
      it("should generate image from text prompt with real API", async () => {
        // Note: Takes too long, but functionality confirmed working
        const req = createMockRequest({
          inputs: "Astronaut riding a horse",
          model: "black-forest-labs/FLUX.1-dev",
          parameters: {num_inference_steps: 5},
        });
        const res = createMockResponse();

        await textToImage(req, res);

        expect(res.statusCode).to.equal(200);
        expect(res.data).to.have.property("image");
        expect(res.data).to.have.property("metadata");
        expect(res.data.image).to.be.a("string");
        expect(res.data.image).to.include("data:image/");
        expect(res.data.image).to.include("base64,");
        expect(res.data.metadata.model).to.equal("black-forest-labs/FLUX.1-dev");
        expect(res.data.metadata.prompt).to.equal("Astronaut riding a horse");
      }).timeout(30000);
    });

    describe("automaticSpeechRecognition", () => {
      it("should handle missing audio input gracefully", async () => {
        const req = createMockRequest({});
        const res = createMockResponse();

        await automaticSpeechRecognition(req, res);

        expect(res.statusCode).to.equal(400);
        expect(res.data.error).to.equal("Missing inputs field (base64 audio data)");
      });
    });
  });

  describe("Authentication and Error Handling", () => {
    it("should return 500 for invalid auth token", async () => {
      sandbox.restore();
      sandbox = sinon.createSandbox();
      sandbox.stub(admin.auth(), "verifyIdToken").rejects(new Error("Invalid token"));

      const req = createMockRequest({inputs: "test"});
      const res = createMockResponse();

      await textClassification(req, res);

      expect(res.statusCode).to.equal(500);
      expect(res.data.error).to.equal("Invalid token");
    });

    it("should return error for missing Authorization header", async () => {
      const req = createMockRequest({inputs: "test"}, {authorization: undefined});
      const res = createMockResponse();

      await textClassification(req, res);

      expect(res.statusCode).to.equal(500);
      expect(res.data.error).to.include("Authorization");
    });

    it("should set CORS headers on responses", async () => {
      const req = createMockRequest({inputs: "test"});
      const res = createMockResponse();

      await textClassification(req, res);

      expect(res.headers["Access-Control-Allow-Origin"]).to.equal("https://noodeler.xyz");
      expect(res.headers["Access-Control-Allow-Methods"]).to.include("POST");
    });
  });
});
