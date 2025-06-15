import {expect} from "chai";
import {describe, it, beforeEach, afterEach} from "mocha";
import * as sinon from "sinon";
import * as admin from "firebase-admin";
import {
  authenticateRequest,
  getDefaultModel,
  validateInput,
  handleError,
} from "../api/utils";
import {
  createMockRequest,
  createMockResponse,
  mockDecodedToken,
  cleanup,
} from "./setup";

describe("Utils", () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  after(() => {
    cleanup();
  });

  describe("authenticateRequest", () => {
    it("should authenticate valid request", async () => {
      const mockVerifyIdToken = sandbox
        .stub(admin.auth(), "verifyIdToken")
        .resolves(mockDecodedToken);
      const req = createMockRequest(
        {},
        {authorization: "Bearer valid-token"}
      );

      await authenticateRequest(req);

      expect(mockVerifyIdToken.calledWith("valid-token")).to.be.true;
    });

    it("should throw error for missing authorization header", async () => {
      const req = createMockRequest({}, {});

      try {
        await authenticateRequest(req);
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.message).to.include("Firebase ID token");
      }
    });

    it("should throw error for invalid authorization header format",
      async () => {
        const req = createMockRequest(
          {},
          {authorization: "Invalid token"}
        );

        try {
          await authenticateRequest(req);
          expect.fail("Should have thrown error");
        } catch (error: any) {
          expect(error.message).to.equal(
            "Missing or invalid Authorization header"
          );
        }
      });
  });

  describe("getDefaultModel", () => {
    it("should return correct default model for known tasks", () => {
      expect(getDefaultModel("text-generation")).to.equal(
        "microsoft/DialoGPT-medium"
      );
      expect(getDefaultModel("text-classification")).to.equal(
        "cardiffnlp/twitter-roberta-base-sentiment-latest"
      );
      expect(getDefaultModel("image-classification")).to.equal(
        "google/vit-base-patch16-224"
      );
      expect(getDefaultModel("text-to-image")).to.equal(
        "black-forest-labs/FLUX.1-dev"
      );
    });

    it("should return fallback model for unknown tasks", () => {
      expect(getDefaultModel("unknown-task")).to.equal("gpt2");
    });
  });

  describe("validateInput", () => {
    it("should return true for valid input", () => {
      const res = createMockResponse();
      const result = validateInput(res, true, "Test error");

      expect(result).to.be.true;
      expect(res.statusCode).to.equal(200);
    });

    it("should return false and set error response for invalid input", () => {
      const res = createMockResponse();
      const result = validateInput(res, false, "Test error message");

      expect(result).to.be.false;
      expect(res.statusCode).to.equal(400);
      expect(res.data).to.deep.equal({error: "Test error message"});
    });
  });

  describe("handleError", () => {
    it("should handle error with response status", () => {
      const res = createMockResponse();
      const error = {
        message: "Test error",
        response: {status: 422},
      };

      handleError(res, error, "Test Context");

      expect(res.statusCode).to.equal(422);
      expect(res.data).to.deep.equal({error: "Test error"});
    });

    it("should handle error without response status", () => {
      const res = createMockResponse();
      const error = {message: "Test error"};

      handleError(res, error, "Test Context");

      expect(res.statusCode).to.equal(500);
      expect(res.data).to.deep.equal({error: "Test error"});
    });

    it("should handle error without message", () => {
      const res = createMockResponse();
      const error = {};

      handleError(res, error, "Test Context");

      expect(res.statusCode).to.equal(500);
      expect(res.data).to.deep.equal({error: "Internal Server Error"});
    });
  });
});
