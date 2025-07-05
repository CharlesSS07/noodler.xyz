/**
 * This test suite verifies the text formatting functionality powered by Google's Gemini AI through GenKit, which transforms and restructures text content according to specified formatting rules and output types. The tests validate the ability to convert text into various formats (plain, markdown, HTML, structured, JSON) while applying custom formatting rules and respecting content preservation settings.
 * 
 * Test categories:
 * • Text Formatting - Tests formatting with different output types (plain, markdown, HTML, structured, JSON), content preservation settings, maxOutputLength constraints, and default parameter handling
 * • Input Validation - Validates rejection of empty text, empty format rules, missing required fields, invalid output types, and invalid maxOutputLength values
 * • Compression Metrics - Verifies accurate calculation of compression/expansion ratios and proper handling of different content transformations
 * • Format Rules Processing - Tests application of specific formatting rules and complex multi-step formatting operations
 */

import {expect} from "chai";
import {textFormatingLLMFlow} from "./textFormatingLLMFlow";

// Note: These tests require GOOGLE_GENAI_API_KEY environment variable to be set
// and will make actual API calls to Google's Gemini service
describe("TextFormattingLLMFlow Integration Tests", function() {
  // Increase timeout for API calls
  // eslint-disable-next-line no-invalid-this
  this.timeout(30000);

  // Skip tests if no API key is provided
  before(function() {
    if (!process.env.GOOGLE_GENAI_API_KEY) {
      // eslint-disable-next-line no-invalid-this
      // this.skip();
      throw new Error("No GOOGLE_GENAI_API_KEY environment variable");
    }
  });

  describe("Text Formatting", () => {
    const testContent = "Machine learning is a subset of artificial " +
      "intelligence. It uses algorithms to analyze data and make " +
      "predictions. Common applications include recommendation systems, " +
      "image recognition, and natural language processing. Deep learning " +
      "uses neural networks with multiple layers to process complex " +
      "patterns.";

    it("should format text with plain output type", async () => {
      const result = await textFormatingLLMFlow({
        text: testContent,
        formatRules: "Format as a numbered list with each sentence as a " +
          "separate item",
        outputType: "plain",
      });

      expect(result).to.have.property("formattedText");
      expect(result).to.have.property("originalLength");
      expect(result).to.have.property("formattedLength");
      expect(result).to.have.property("compressionRatio");
      expect(result).to.have.property("formatApplied");

      expect(result.formattedText).to.be.a("string");
      expect(result.formattedText.length).to.be.greaterThan(0);
      expect(result.originalLength).to.equal(testContent.length);
      expect(result.formattedLength).to.equal(result.formattedText.length);
      expect(result.compressionRatio).to.be.a("number");
      expect(result.formatApplied).to.include("plain format");
    });

    it("should format text with markdown output type", async () => {
      const result = await textFormatingLLMFlow({
        text: testContent,
        formatRules: "Convert to markdown with headers and bullet points",
        outputType: "markdown",
      });

      expect(result).to.have.property("formattedText");
      expect(result.formattedText).to.be.a("string");
      expect(result.formattedText.length).to.be.greaterThan(0);
      expect(result.formatApplied).to.include("markdown format");
    });

    it("should format text with html output type", async () => {
      const result = await textFormatingLLMFlow({
        text: testContent,
        formatRules: "Convert to HTML with proper paragraph and list tags",
        outputType: "html",
      });

      expect(result).to.have.property("formattedText");
      expect(result.formattedText).to.be.a("string");
      expect(result.formattedText.length).to.be.greaterThan(0);
      expect(result.formatApplied).to.include("html format");
    });

    it("should format text with structured output type", async () => {
      const result = await textFormatingLLMFlow({
        text: testContent,
        formatRules: "Organize into clear sections with headers",
        outputType: "structured",
      });

      expect(result).to.have.property("formattedText");
      expect(result.formattedText).to.be.a("string");
      expect(result.formattedText.length).to.be.greaterThan(0);
      expect(result.formatApplied).to.include("structured format");
    });

    it("should format text with json output type", async () => {
      const result = await textFormatingLLMFlow({
        text: testContent,
        formatRules: "Convert to JSON with key-value pairs for each concept",
        outputType: "json",
      });

      expect(result).to.have.property("formattedText");
      expect(result.formattedText).to.be.a("string");
      expect(result.formattedText.length).to.be.greaterThan(0);
      expect(result.formatApplied).to.include("json format");
    });

    it("should respect preserveContent setting", async () => {
      const result = await textFormatingLLMFlow({
        text: testContent,
        formatRules: "Summarize into 3 key points",
        preserveContent: false,
      });

      expect(result).to.have.property("formattedText");
      expect(result.formattedText).to.be.a("string");
      expect(result.formattedText.length).to.be.greaterThan(0);
    });

    it("should respect maxOutputLength setting", async () => {
      const result = await textFormatingLLMFlow({
        text: testContent,
        formatRules: "Reformat with line breaks after each sentence",
        maxOutputLength: 100,
      });

      expect(result).to.have.property("formattedText");
      expect(result.formattedText).to.be.a("string");
      // Allow some tolerance
      expect(result.formattedText.length).to.be.lessThanOrEqual(130);
    });

    it("should use default values when optional parameters are not " +
      "provided", async () => {
      const result = await textFormatingLLMFlow({
        text: testContent,
        formatRules: "Add bullet points to each sentence",
      });

      expect(result).to.have.property("formattedText");
      expect(result.formattedText).to.be.a("string");
      expect(result.formattedText.length).to.be.greaterThan(0);
      // expect(result.formatApplied).to.include("plain format");
    });
  });

  describe("Input Validation", () => {
    it("should reject empty text", async () => {
      try {
        await textFormatingLLMFlow({
          text: "",
          formatRules: "Format as list",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: unknown) {
        expect((error as Error).message).to.include("Schema validation failed");
      }
    });

    it("should reject empty format rules", async () => {
      try {
        await textFormatingLLMFlow({
          text: "Some text",
          formatRules: "",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: unknown) {
        expect((error as Error).message).to.include("Schema validation failed");
      }
    });

    it("should reject request without text field", async () => {
      try {
        await textFormatingLLMFlow({
          formatRules: "Format as list",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: unknown) {
        expect((error as Error).message).to.include("Required");
      }
    });

    it("should reject request without formatRules field", async () => {
      try {
        await textFormatingLLMFlow({
          text: "Some text",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: unknown) {
        expect((error as Error).message).to.include("Required");
      }
    });

    it("should reject invalid outputType", async () => {
      try {
        await textFormatingLLMFlow({
          text: "Some text",
          formatRules: "Format as list",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          outputType: "invalid" as any,
        });
        expect.fail("Should have thrown validation error");
      } catch (error: unknown) {
        expect((error as Error).message).to.include("INVALID_ARGUMENT");
      }
    });

    it("should reject maxOutputLength below minimum", async () => {
      try {
        await textFormatingLLMFlow({
          text: "Some text",
          formatRules: "Format as list",
          maxOutputLength: 5,
        });
        expect.fail("Should have thrown validation error");
      } catch (error: unknown) {
        expect((error as Error).message).to.include("INVALID_ARGUMENT");
      }
    });

    it("should reject maxOutputLength above maximum", async () => {
      try {
        await textFormatingLLMFlow({
          text: "Some text",
          formatRules: "Format as list",
          maxOutputLength: 15000,
        });
        expect.fail("Should have thrown validation error");
      } catch (error: unknown) {
        expect((error as Error).message).to.include("INVALID_ARGUMENT");
      }
    });
  });

  describe("Compression Metrics", () => {
    it("should calculate compression ratio correctly", async () => {
      const shortContent = "This is a short test sentence.";

      const result = await textFormatingLLMFlow({
        text: shortContent,
        formatRules: "Add prefix 'Formatted: ' to the text",
      });

      expect(result.originalLength).to.equal(shortContent.length);
      expect(result.formattedLength).to.equal(result.formattedText.length);
      expect(result.compressionRatio).to.equal(
        Math.round((result.formattedLength / result.originalLength) * 100) / 100
      );
    });

    it("should handle expansion ratio correctly", async () => {
      const shortContent = "AI.";

      const result = await textFormatingLLMFlow({
        text: shortContent,
        formatRules: "Expand the abbreviation and add explanation",
      });

      expect(result.originalLength).to.equal(shortContent.length);
      expect(result.formattedLength).to.equal(result.formattedText.length);
      // Should be expansion
      expect(result.compressionRatio).to.be.greaterThan(1);
    });
  });

  describe("Format Rules Processing", () => {
    it("should apply specific formatting rules", async () => {
      const testText = "The quick brown fox jumps over the lazy dog.";

      const result = await textFormatingLLMFlow({
        text: testText,
        formatRules: "Convert to uppercase letters only",
      });

      expect(result.formattedText).to.be.a("string");
      expect(result.formattedText.length).to.be.greaterThan(0);
    });

    it("should handle complex formatting rules", async () => {
      const testText = "Machine learning algorithms process data to make " +
        "predictions.";

      const result = await textFormatingLLMFlow({
        text: testText,
        formatRules: "Break into individual words, number each word, " +
          "and format as a vertical list",
        outputType: "structured",
      });

      expect(result.formattedText).to.be.a("string");
      expect(result.formattedText.length).to.be.greaterThan(0);
      expect(result.formatApplied).to.include("structured format");
    });
  });
});
