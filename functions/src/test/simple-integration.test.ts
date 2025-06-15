import {expect} from "chai";
import {describe, it} from "mocha";
import axios from "axios";

describe("Simple HuggingFace API Test", () => {
  it("should test HuggingFace API connection", async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(30000);

    const token = process.env.HUGGINGFACE_TOKEN;
    expect(token).to.exist;
    console.log("Token exists:", !!token);
    console.log("Token starts with:", token?.substring(0, 10) + "...");

    // Test with a simple model that should be available
    const url =
      "https://api-inference.huggingface.co/models/deepset/roberta-base-squad2";

    try {
      const response = await axios({
        method: "POST",
        url: url,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        data: {
          inputs: {
            question: "What is the capital?",
            context:
              "France is a country. Paris is the capital of France.",
          },
        },
        timeout: 20000,
      });

      console.log("Response status:", response.status);
      console.log("Response data:", response.data);

      expect(response.status).to.equal(200);
    } catch (error: any) {
      console.error("Error details:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: url,
      });
      throw error;
    }
  });
});
