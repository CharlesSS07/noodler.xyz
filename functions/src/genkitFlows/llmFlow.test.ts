/**
 * This test suite verifies the LLM Flow functionality, which provides a Firebase Functions-based interface for calling Google's Gemini AI models through GenKit. The tests validate text generation capabilities with various parameter configurations, ensuring proper input validation, response structure, and error handling. The suite covers basic text generation, custom parameter handling (maxTokens, temperature), input validation scenarios, response metrics calculation, and parameter boundary testing.
 * 
 * Test categories:
 * • LLM Generation - Tests basic text generation with simple prompts, custom maxTokens and temperature settings, default parameter handling, and complex multi-line prompt processing
 * • Input Validation - Validates rejection of empty prompts, missing prompt fields, invalid temperature values, and negative temperature values
 * • Response Metrics - Verifies correct calculation of prompt and response lengths for various input sizes
 * • Parameter Validation - Tests acceptance of valid temperature boundaries and positive maxTokens values
 */

import {expect} from "chai";
import {llmFlow} from "./llmFlow";

// Note: These tests require GOOGLE_GENAI_API_KEY environment variable to be set
// and will make actual API calls to Google's Gemini service
describe("LLMFlow Integration Tests", function() {
  // Increase timeout for API calls
  // eslint-disable-next-line no-invalid-this
  this.timeout(30000);

  // Skip tests if no API key is provided
  before(function() {
    if (!process.env.GOOGLE_GENAI_API_KEY) {
      // eslint-disable-next-line no-invalid-this
      this.skip();
    }
  });

  describe("LLM Generation", () => {
    it("should generate response for simple prompt", async () => {
      const result = await llmFlow({
        prompt: "What is the capital of France?",
      });

      expect(result).to.have.property("response");
      expect(result).to.have.property("promptLength");
      expect(result).to.have.property("responseLength");

      expect(result.response).to.be.a("string");
      expect(result.response.length).to.be.greaterThan(0);
      expect(result.promptLength).to.equal(
        "What is the capital of France?".length
      );
      expect(result.responseLength).to.equal(result.response.length);
    });

    it("should generate response with custom maxTokens", async () => {
      const result = await llmFlow({
        prompt: "Tell me about artificial intelligence",
        maxTokens: 100,
      });

      expect(result).to.have.property("response");
      expect(result.response).to.be.a("string");
      expect(result.response.length).to.be.greaterThan(0);
    });

    it("should generate response with custom temperature", async () => {
      const result = await llmFlow({
        prompt: "Write a creative story about a robot",
        temperature: 1.2,
      });

      expect(result).to.have.property("response");
      expect(result.response).to.be.a("string");
      expect(result.response.length).to.be.greaterThan(0);
    });

    it("should use default values when optional parameters " +
      "are not provided", async () => {
      const result = await llmFlow({
        prompt: "Explain quantum computing in simple terms",
      });

      expect(result).to.have.property("response");
      expect(result.response).to.be.a("string");
      expect(result.response.length).to.be.greaterThan(0);
    });

    it("should handle complex multi-line prompts", async () => {
      const complexPrompt = "Please analyze the following code " +
        "and explain what it does:\n\n" +
        "function fibonacci(n) {\n" +
        "    if (n <= 1) return n;\n" +
        "    return fibonacci(n - 1) + fibonacci(n - 2);\n" +
        "}\n\n" +
        "Provide a detailed explanation.";

      const result = await llmFlow({
        prompt: complexPrompt,
        maxTokens: 500,
      });

      expect(result).to.have.property("response");
      expect(result.response).to.be.a("string");
      expect(result.response.length).to.be.greaterThan(0);
      expect(result.promptLength).to.equal(complexPrompt.length);
    });
  });

  describe("Input Validation", () => {
    it("should reject empty prompt", async () => {
      try {
        await llmFlow({
          prompt: "",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: unknown) {
        expect((error as Error).message).to.include("Schema validation failed");
      }
    });

    it("should reject request without prompt field", async () => {
      try {
        await llmFlow({});
        expect.fail("Should have thrown validation error");
      } catch (error: unknown) {
        expect((error as Error).message).to.include("Required");
      }
    });

    it("should reject invalid temperature values", async () => {
      try {
        await llmFlow({
          prompt: "Test prompt",
          temperature: 3.0, // Invalid: > 2
        });
        expect.fail("Should have thrown validation error");
      } catch (error: unknown) {
        expect((error as Error).message).to.include("Schema validation failed");
      }
    });

    it("should reject negative temperature values", async () => {
      try {
        await llmFlow({
          prompt: "Test prompt",
          temperature: -0.5, // Invalid: < 0
        });
        expect.fail("Should have thrown validation error");
      } catch (error: unknown) {
        expect((error as Error).message).to.include("Schema validation failed");
      }
    });
  });

  describe("Response Metrics", () => {
    it("should calculate prompt and response lengths correctly", async () => {
      const testPrompt = "Count to five.";

      const result = await llmFlow({
        prompt: testPrompt,
        maxTokens: 50,
      });

      expect(result.promptLength).to.equal(testPrompt.length);
      expect(result.responseLength).to.equal(result.response.length);
      expect(result.response.length).to.be.greaterThan(0);
    });

    it("should handle very short prompts", async () => {
      const shortPrompt = "Hi";

      const result = await llmFlow({
        prompt: shortPrompt,
      });

      expect(result.promptLength).to.equal(shortPrompt.length);
      expect(result.responseLength).to.equal(result.response.length);
      expect(result.response.length).to.be.greaterThan(0);
    });
  });

  describe("Parameter Validation", () => {
    it("should accept valid temperature at boundaries", async () => {
      const result1 = await llmFlow({
        prompt: "Test prompt",
        temperature: 0, // Min valid value
      });
      expect(result1).to.have.property("response");

      const result2 = await llmFlow({
        prompt: "Test prompt",
        temperature: 2, // Max valid value
      });
      expect(result2).to.have.property("response");
    });

    it("should accept positive maxTokens values", async () => {
      const result = await llmFlow({
        prompt: "Test prompt",
        maxTokens: 50,
      });
      expect(result).to.have.property("response");
    });
  });
});
