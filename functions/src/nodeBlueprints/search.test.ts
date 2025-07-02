// Load environment variables from .env file
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({path: path.join(__dirname, "../../.env")});

// Set emulator environment variables BEFORE importing anything
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";

import {expect} from "chai";
import {describe, it, before, after, beforeEach} from "mocha";
import * as admin from "firebase-admin";
import {getFirestore} from "firebase-admin/firestore";
import {
  nodeBluePrintToText,
  embedNodeBluePrint,
  removeNodeBluePrintEmbeddingFromIndex,
  reEmbedNodeBluePrint,
  reEmbedAllNodeBluePrints,
  clearAllVectorEmbeddings,
  searchNodeBluePrints,
  embedAllUnembeddedNodeBluePrints,
} from "./search";

// Test data using test-specific NIDs (not real ones)
const mockNodeBluePrintData = {
  nid: "test-add-node",
  title: "Add Numbers",
  documentation: "Adds two numbers together",
  tags: ["math", "arithmetic", "basic", "calculator", "addition"],
  trust_level: "high",
  input_sockets: [
    {
      key: "a",
      type: "number",
      description: "First number to add",
    },
    {
      key: "b",
      type: "number",
      description: "Second number to add",
    },
  ],
  output_sockets: [
    {
      key: "result",
      type: "number",
      description: "The sum of A + B",
    },
  ],
  author_uid: "test",
  created_at: new Date().toISOString(),
  last_updated_at: new Date().toISOString(),
  searchable: true,
};

describe("NodeBlueprint Search Functions", function() {
  let firestore: admin.firestore.Firestore;

  before(async function() {
    // Initialize Firebase Admin if not already initialized
    if (!admin.apps.length) {
      admin.initializeApp({
        projectId: "test-project",
      });
    }

    firestore = getFirestore();
  });

  beforeEach(async function() {
    // Clear test data before each test
    const collections = ["nodes"];
    for (const collectionName of collections) {
      const snapshot = await firestore.collection(collectionName).get();
      const deletePromises = snapshot.docs.map((doc) => doc.ref.delete());
      await Promise.all(deletePromises);
    }
  });

  after(async function() {
    // Clean up after all tests
    const collections = ["nodes"];
    for (const collectionName of collections) {
      const snapshot = await firestore.collection(collectionName).get();
      const deletePromises = snapshot.docs.map((doc) => doc.ref.delete());
      await Promise.all(deletePromises);
    }
  });

  describe("nodeBluePrintToText", () => {
    it("should convert NodeBlueprint to text description", async () => {
      // Create test document
      await firestore
        .collection("nodes")
        .doc("test-add-node")
        .set(mockNodeBluePrintData);

      const result = await nodeBluePrintToText("test-add-node");

      expect(result).to.be.a("string");
      expect(result).to.include("Title: Add Numbers");
      expect(result).to.include(
        "Description: Adds two numbers together"
      );
      expect(result).to.include(
        "Tags: math, arithmetic, basic, calculator, addition"
      );
      expect(result).to.include("Trust Level: high");
      expect(result).to.include(
        "Input Sockets: a: number - First number to add; " +
        "b: number - Second number to add"
      );
      expect(result).to.include(
        "Output Sockets: result: number - The sum of A + B"
      );
    });

    it("should handle NodeBlueprint with minimal data",
      async () => {
        const minimalData = {
          nid: "test-minimal-node",
          title: "Subtract Numbers",
          searchable: true,
        };

        await firestore
          .collection("nodes")
          .doc("test-minimal-node")
          .set(minimalData);

        const result = await nodeBluePrintToText("test-minimal-node");

        expect(result).to.be.a("string");
        expect(result).to.include("Title: Subtract Numbers");
        expect(result).to.not.include("Description:");
        expect(result).to.not.include("Tags:");
      });

    it("should throw error when NodeBlueprint is not found", async () => {
      try {
        await nodeBluePrintToText("test-nonexistent");
        expect.fail("Should have thrown an error");
      } catch (error: unknown) {
        expect((error as Error).message).to.include(
          "NodeBluePrint with nid test-nonexistent not found"
        );
      }
    });

    it("should throw error when nid is empty", async () => {
      try {
        await nodeBluePrintToText("");
        expect.fail("Should have thrown an error");
      } catch (error: unknown) {
        expect(error).to.be.instanceOf(Error);
      }
    });
  });

  describe("embedNodeBluePrint", () => {
    it("should throw error when nid is empty", async () => {
      try {
        await embedNodeBluePrint("");
        expect.fail("Should have thrown an error");
      } catch (error: unknown) {
        expect((error as Error).message).to.include(
          "NodeBluePrint ID (nid) is required"
        );
      }
    });

    it("should throw error when nid is undefined", async () => {
      try {
        await embedNodeBluePrint(undefined as unknown as string);
        expect.fail("Should have thrown an error");
      } catch (error: unknown) {
        expect((error as Error).message).to.include(
          "NodeBluePrint ID (nid) is required"
        );
      }
    });

    it("should embed a NodeBlueprint successfully", async () => {
      await firestore
        .collection("nodes")
        .doc("test-add-node")
        .set(mockNodeBluePrintData);

      await embedNodeBluePrint("test-add-node");

      const vectorDoc = await firestore
        .collection("nodes")
        .doc("test-add-node")
        .get();

      expect(vectorDoc.exists).to.be.true;
      const data = vectorDoc.data();
      expect(data).to.have.property("embedding");
      expect(data).to.have.property("text");
      expect(data.embedding).to.exist;
      expect(data.text).to.be.a("string");
      expect(data.text).to.include("Add Numbers");
    });
  });

  describe("removeNodeBluePrintEmbeddingFromIndex", () => {
    it("should remove NodeBlueprint embedding from vector index", async () => {
      // Create a vector document first with embedding
      await firestore
        .collection("nodes")
        .doc("test-vector-node")
        .set({
          nid: "test-vector-node",
          text: "test",
          embedding: [0.1, 0.2, 0.3], // mock embedding
        });

      await removeNodeBluePrintEmbeddingFromIndex("test-vector-node");

      const doc = await firestore
        .collection("nodes")
        .doc("test-vector-node")
        .get();

      expect(doc.exists).to.be.true;
      const data = doc.data();
      expect(data).to.have.property("nid");
      expect(data).to.have.property("text");
      expect(data).to.not.have.property("embedding");
    });

    it("should throw error when nid is empty", async () => {
      try {
        await removeNodeBluePrintEmbeddingFromIndex("");
        expect.fail("Should have thrown an error");
      } catch (error: unknown) {
        expect((error as Error).message).to.include(
          "NodeBluePrint ID (nid) is required"
        );
      }
    });

    it("should throw error when nid is undefined", async () => {
      try {
        await removeNodeBluePrintEmbeddingFromIndex(
          undefined as unknown as string
        );
        expect.fail("Should have thrown an error");
      } catch (error: unknown) {
        expect((error as Error).message).to.include(
          "NodeBluePrint ID (nid) is required"
        );
      }
    });
  });

  describe("reEmbedNodeBluePrint", () => {
    it("should reEmbed NodeBlueprint embedding from vector index", async () => {
      // Create an existing vector document with old embedding
      await firestore
        .collection("nodes")
        .doc(mockNodeBluePrintData.nid)
        .set({
          ...mockNodeBluePrintData,
          embedding: [0.1, 0.2, 0.3], // old embedding
          text: "old text representation",
        });

      await reEmbedNodeBluePrint(mockNodeBluePrintData.nid);

      const doc = await firestore
        .collection("nodes")
        .doc(mockNodeBluePrintData.nid)
        .get();

      expect(doc.exists).to.be.true;
      const data = doc.data();
      expect(data).to.have.property("embedding");
      expect(data).to.have.property("text");
      expect(data.embedding).to.exist;
      expect(data.text).to.be.a("string");
      // The text should be updated to the new representation
      expect(data.text).to.not.equal("old text representation");
      expect(data.text).to.include("Add Numbers");
    });

    it("should throw error when nid is empty", async () => {
      try {
        await reEmbedNodeBluePrint("");
        expect.fail("Should have thrown an error");
      } catch (error: unknown) {
        expect((error as Error).message).to.include(
          "NodeBluePrint ID (nid) is required"
        );
      }
    });

    it("should throw error when nid is undefined", async () => {
      try {
        await reEmbedNodeBluePrint(undefined as unknown as string);
        expect.fail("Should have thrown an error");
      } catch (error: unknown) {
        expect((error as Error).message).to.include(
          "NodeBluePrint ID (nid) is required"
        );
      }
    });
  });

  describe("clearAllVectorEmbeddings", () => {
    it("should return count of deleted embeddings", async () => {
      // Create some test vector documents with embeddings
      await firestore
        .collection("nodes")
        .doc("test-vector-1")
        .set({
          nid: "test-vector-1",
          text: "test1",
          embedding: [0.1, 0.2, 0.3],
          title: "Test Node 1",
        });
      await firestore
        .collection("nodes")
        .doc("test-vector-2")
        .set({
          nid: "test-vector-2",
          text: "test2",
          embedding: [0.4, 0.5, 0.6],
          title: "Test Node 2",
        });

      const result = await clearAllVectorEmbeddings();

      expect(result).to.have.property("deletedCount");
      expect(result.deletedCount).to.be.a("number");
      expect(result.deletedCount).to.equal(2);

      // Verify documents still exist but embeddings are removed
      const snapshot = await firestore
        .collection("nodes")
        .get();
      expect(snapshot.empty).to.be.false;
      expect(snapshot.size).to.equal(2);

      // Check each document still exists but embedding is gone
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        expect(data).to.have.property("nid");
        expect(data).to.have.property("text");
        expect(data).to.have.property("title");
        expect(data).to.not.have.property("embedding");
      });
    });

    it("should handle empty collection", async () => {
      const result = await clearAllVectorEmbeddings();

      expect(result.deletedCount).to.equal(0);
    });
  });

  describe("reEmbedAllNodeBluePrints", () => {
    it("should return processing results", async () => {
      // Create test nodes
      await firestore
        .collection("nodes")
        .doc("test-node-1")
        .set({...mockNodeBluePrintData, nid: "test-node-1", searchable: true});
      await firestore
        .collection("nodes")
        .doc("test-node-2")
        .set({
          ...mockNodeBluePrintData,
          nid: "test-node-2",
          title: "Multiply Numbers",
          searchable: true,
        });

      const result = await reEmbedAllNodeBluePrints();
      expect(result).to.have.property("processed");
      expect(result).to.have.property("errors");
      expect(result).to.have.property("errorDetails");
      expect(result.processed).to.be.a("number");
      expect(result.errors).to.be.a("number");
      expect(result.errorDetails).to.be.an("array");
      expect(result.processed).to.equal(2);
      expect(result.errors).to.equal(0);
    });
  });

  describe("embedAllUnembeddedNodeBluePrints", () => {
    it("should embed only nodes without existing embeddings", async () => {
      // Create test nodes in vector collection
      await firestore
        .collection("nodes")
        .doc("test-unembedded-1")
        .set({
          ...mockNodeBluePrintData,
          nid: "test-unembedded-1",
          title: "Node Without Embedding",
          searchable: true,
          embedding: null, // No embedding yet
        });
      await firestore
        .collection("nodes")
        .doc("test-unembedded-2")
        .set({
          ...mockNodeBluePrintData,
          nid: "test-unembedded-2",
          title: "Another Node Without Embedding",
          searchable: true,
          embedding: null, // No embedding yet
        });
      await firestore
        .collection("nodes")
        .doc("test-embedded-1")
        .set({
          ...mockNodeBluePrintData,
          nid: "test-embedded-1",
          title: "Node With Embedding",
          searchable: true,
          embedding: [0.1, 0.2, 0.3], // Already has embedding
        });

      const result = await embedAllUnembeddedNodeBluePrints();
      expect(result).to.have.property("processed");
      expect(result).to.have.property("errors");
      expect(result).to.have.property("errorDetails");
      expect(result.processed).to.be.a("number");
      expect(result.errors).to.be.a("number");
      expect(result.errorDetails).to.be.an("array");

      // Should only process the 2 nodes without embeddings
      expect(result.processed).to.equal(2);
      expect(result.errors).to.equal(0);
    });

    it("should skip non-searchable nodes", async () => {
      // Create test nodes - some searchable, some not
      await firestore
        .collection("nodes")
        .doc("test-searchable")
        .set({
          ...mockNodeBluePrintData,
          nid: "test-searchable",
          title: "Searchable Node",
          searchable: true,
          embedding: null,
        });
      await firestore
        .collection("nodes")
        .doc("test-not-searchable")
        .set({
          ...mockNodeBluePrintData,
          nid: "test-not-searchable",
          title: "Non-Searchable Node",
          searchable: false,
          embedding: null,
        });

      const result = await embedAllUnembeddedNodeBluePrints();
      expect(result).to.have.property("processed");
      expect(result).to.have.property("errors");
      expect(result).to.have.property("errorDetails");

      // Should only process the 1 searchable node
      expect(result.processed).to.equal(1);
      expect(result.errors).to.equal(0);
    });

    it("should handle empty collection", async () => {
      const result = await embedAllUnembeddedNodeBluePrints();

      expect(result.processed).to.equal(0);
      expect(result.errors).to.equal(0);
      expect(result.errorDetails).to.be.an("array").that.is.empty;
    });
  });

  describe("searchNodeBluePrints", () => {
    it("should throw error when query is empty", async () => {
      try {
        await searchNodeBluePrints({query: ""});
        expect.fail("Should have thrown an error");
      } catch (error: unknown) {
        expect((error as Error).message).to.include(
          "Search query is required"
        );
      }
    });

    it("should throw error when query is undefined", async () => {
      try {
        await searchNodeBluePrints({
          query: undefined as unknown as string,
        });
        expect.fail("Should have thrown an error");
      } catch (error: unknown) {
        expect((error as Error).message).to.include(
          "Search query is required"
        );
      }
    });

    it("should return search results", async () => {
      const options = {
        query: "test search",
      };

      const result = await searchNodeBluePrints(options);

      expect(result).to.have.property("results");
      expect(result).to.have.property("totalFound");
      expect(result.results).to.be.an("array");
      expect(result.totalFound).to.be.a("number");
    });

    it(
      "should find specific node by content and return correct nid first",
      async () => {
      // Create 3 different nodes with distinct content
        const addNode = {
          nid: "test-add-specific",
          title: "Add Numbers Calculator",
          documentation: "Performs addition of two numerical values",
          tags: ["math", "arithmetic", "addition"],
          trust_level: "high",
          input_sockets: [
            {key: "a", type: "number", description: "First number"},
            {key: "b", type: "number", description: "Second number"},
          ],
          output_sockets: [
            {key: "result", type: "number", description: "Sum result"},
          ],
          author_uid: "test",
          created_at: new Date().toISOString(),
          last_updated_at: new Date().toISOString(),
          searchable: true,
        };

        const multiplyNode = {
          nid: "test-multiply-specific",
          title: "Multiply Numbers",
          documentation: "Performs multiplication of two values",
          tags: ["math", "arithmetic", "multiplication"],
          trust_level: "high",
          input_sockets: [
            {key: "x", type: "number", description: "First factor"},
            {key: "y", type: "number", description: "Second factor"},
          ],
          output_sockets: [
            {
              key: "product",
              type: "number",
              description: "Multiplication result",
            },
          ],
          author_uid: "test",
          created_at: new Date().toISOString(),
          last_updated_at: new Date().toISOString(),
          searchable: true,
        };

        const textNode = {
          nid: "test-text-specific",
          title: "Text Processor",
          documentation: "Processes and transforms text strings",
          tags: ["text", "string", "processing"],
          trust_level: "medium",
          input_sockets: [
            {key: "input", type: "string", description: "Input text"},
          ],
          output_sockets: [
            {key: "output", type: "string", description: "Processed text"},
          ],
          author_uid: "test",
          created_at: new Date().toISOString(),
          last_updated_at: new Date().toISOString(),
          searchable: true,
        };

        // Save all nodes to Firestore
        await firestore
          .collection("nodes")
          .doc("test-add-specific")
          .set(addNode);
        await firestore
          .collection("nodes")
          .doc("test-multiply-specific")
          .set(multiplyNode);
        await firestore
          .collection("nodes")
          .doc("test-text-specific")
          .set(textNode);

        // Embed all nodes
        await embedNodeBluePrint("test-add-specific");
        await embedNodeBluePrint("test-multiply-specific");
        await embedNodeBluePrint("test-text-specific");

        // Search for the addition node using specific content
        const result = await searchNodeBluePrints({
          query: "addition calculator arithmetic add numbers sum",
        });

        expect(result.results).to.be.an("array");
        expect(result.results.length).to.be.greaterThan(0);
        expect(result.results[0].nid).to.equal("test-add-specific");
      });
  });

  describe("Input Validation", () => {
    it("should handle null inputs gracefully", async () => {
      try {
        await nodeBluePrintToText(null as unknown as string);
        expect.fail("Should have thrown an error");
      } catch (error: unknown) {
        expect(error).to.be.instanceOf(Error);
      }
    });

    it("should handle undefined inputs gracefully", async () => {
      try {
        await removeNodeBluePrintEmbeddingFromIndex(
          undefined as unknown as string
        );
        expect.fail("Should have thrown an error");
      } catch (error: unknown) {
        expect((error as Error).message).to.include(
          "NodeBluePrint ID (nid) is required"
        );
      }
    });
  });
});
