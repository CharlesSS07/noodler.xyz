import {expect} from "chai";
import {contentSummarizationFlow} from "./summarizationFlow";

// Note: These tests require GOOGLE_GENAI_API_KEY environment variable to be set
// and will make actual API calls to Google's Gemini service
describe("SummarizationFlow Integration Tests", function() {
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

  describe("Content Summarization", () => {
    const testContent = "Artificial Intelligence (AI) has revolutionized " +
      "numerous industries and aspects of daily life. Machine learning " +
      "algorithms can now process vast amounts of data to identify " +
      "patterns and make predictions. Natural language processing " +
      "enables computers to understand and generate human language. " +
      "Computer vision allows machines to interpret and analyze " +
      "visual information from the world around them. AI applications " +
      "range from recommendation systems and autonomous vehicles to " +
      "medical diagnosis and financial analysis. As AI technology " +
      "continues to advance, it presents both exciting opportunities " +
      "and important ethical considerations that society must address " +
      "carefully.";

    it("should summarize content with brief style", async () => {
      const result = await contentSummarizationFlow({
        content: testContent,
        style: "brief",
        maxLength: 100,
      });

      expect(result).to.have.property("summary");
      expect(result).to.have.property("originalLength");
      expect(result).to.have.property("summaryLength");
      expect(result).to.have.property("compressionRatio");

      expect(result.summary).to.be.a("string");
      expect(result.summary.length).to.be.greaterThan(0);
      expect(result.originalLength).to.equal(testContent.length);
      expect(result.summaryLength).to.equal(result.summary.length);
      expect(result.compressionRatio).to.be.a("number");
      expect(result.compressionRatio).to.be.lessThan(1);
    });

    it("should summarize content with detailed style", async () => {
      const result = await contentSummarizationFlow({
        content: testContent,
        style: "detailed",
        maxLength: 200,
      });

      expect(result).to.have.property("summary");
      expect(result.summary).to.be.a("string");
      expect(result.summary.length).to.be.greaterThan(0);
    });

    it("should summarize content with bullet-points style", async () => {
      const result = await contentSummarizationFlow({
        content: testContent,
        style: "bullet-points",
      });

      expect(result).to.have.property("summary");
      expect(result.summary).to.be.a("string");
      expect(result.summary.length).to.be.greaterThan(0);
    });

    it("should use default values when optional parameters " +
      "are not provided", async () => {
      const result = await contentSummarizationFlow({
        content: testContent,
      });

      expect(result).to.have.property("summary");
      expect(result.summary).to.be.a("string");
      expect(result.summary.length).to.be.greaterThan(0);
    });
  });

  describe("Input Validation", () => {
    it("should reject empty content", async () => {
      try {
        await contentSummarizationFlow({
          content: "",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: unknown) {
        expect((error as Error).message).to.include("Schema validation failed");
      }
    });

    it("should reject request without content field", async () => {
      try {
        await contentSummarizationFlow({});
        expect.fail("Should have thrown validation error");
      } catch (error: unknown) {
        expect((error as Error).message).to.include("Required");
      }
    });
  });

  describe("Compression Metrics", () => {
    it("should calculate compression ratio correctly", async () => {
      const shortContent = "This is a short test.";

      const result = await contentSummarizationFlow({
        content: shortContent,
        style: "brief",
        maxLength: 50,
      });

      expect(result.originalLength).to.equal(shortContent.length);
      expect(result.summaryLength).to.equal(result.summary.length);
      expect(result.compressionRatio).to.equal(
        Math.round((result.summaryLength / result.originalLength) * 100) / 100
      );
    });
  });
});
