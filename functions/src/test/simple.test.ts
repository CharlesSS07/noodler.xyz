/**
 * Simple Function Tests - Basic validation that functions are properly exported
 */

// IMPORTANT: Set environment variables BEFORE importing any Firebase modules
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";
process.env.GCLOUD_PROJECT = "demo-project";
process.env.FIREBASE_PROJECT_ID = "demo-project";

const chai = require("chai");
const expect = chai.expect;

describe("Function Exports", () => {
  it("should import functions without errors", async () => {
    try {
      const functions = require("../index");
      
      // Check that all expected functions are exported
      expect(functions).to.have.property("getNodeBlueprint");
      expect(functions).to.have.property("createNodeBlueprint"); 
      expect(functions).to.have.property("forkNodeBlueprint");
      expect(functions).to.have.property("updateNodeBlueprintSpec");
      expect(functions).to.have.property("updateNodeBlueprintDocs");
      expect(functions).to.have.property("deployNodeBlueprint");
      expect(functions).to.have.property("searchNodeBlueprintsByText");
      expect(functions).to.have.property("healthCheck");
      
    } catch (error) {
      console.error("Import error:", error);
      throw error;
    }
  });

  it("should validate function structure", () => {
    const functions = require("../index");
    
    // Each callable function should have a run method
    expect(functions.getNodeBlueprint).to.have.property("run");
    expect(functions.createNodeBlueprint).to.have.property("run");
    expect(functions.forkNodeBlueprint).to.have.property("run");
    expect(functions.updateNodeBlueprintSpec).to.have.property("run");
    expect(functions.updateNodeBlueprintDocs).to.have.property("run");
    expect(functions.deployNodeBlueprint).to.have.property("run");
    expect(functions.searchNodeBlueprintsByText).to.have.property("run");
    
  });

  it("should create and retrieve official_node_add", async () => {
    const functions = require("../index");

    try {
      // Mock auth context for the test
      const mockAuth = {
        uid: "test-user",
        token: {}
      };

      // First create the official_node_add node blueprint
      const createRequest = {
        auth: mockAuth,
        data: { hint: "add" },
        rawRequest: {}
      };

      const createResult = await functions.createNodeBlueprint.run(createRequest);

      // Update the node to match the add node from FirestoreStandardNodeSet
      const updateDocsRequest = {
        auth: mockAuth,
        data: {
          nodeId: createResult.nodeId,
          title: "Add Numbers",
          docs: "Adds two numbers together"
        },
        rawRequest: {}
      };

      await functions.updateNodeBlueprintDocs.run(updateDocsRequest);

      // Update the node specification
      const updateSpecRequest = {
        auth: mockAuth,
        data: {
          nodeId: createResult.nodeId,
          newCode: `
        const a = inputs.a || 0;
        const b = inputs.b || 0;
        const result = a + b;
        outputs.set('result', result);
      `,
          newSpec: {
            input_sockets: {
              "a": {
                label: "Number A",
                documentation: "First number to add",
                type: "number"
              },
              "b": {
                label: "Number B",
                documentation: "Second number to add", 
                type: "number"
              }
            },
            input_socket_order: ["a", "b"],
            output_sockets: {
              "result": {
                label: "Sum",
                documentation: "The sum of A + B",
                type: "number"
              }
            },
            output_socket_order: ["result"]
          }
        },
        rawRequest: {}
      };

      await functions.updateNodeBlueprintSpec.run(updateSpecRequest);

      // Now retrieve and verify the complete node data
      const getNodeRequest = {
        auth: mockAuth,
        data: { nodeId: createResult.nodeId },
        rawRequest: {}
      };

      const nodeData = await functions.getNodeBlueprint.run(getNodeRequest);
      
      // Verify the node was created correctly
      expect(nodeData).to.have.property('node_key');
      expect(nodeData).to.have.property('title', 'Add Numbers');
      expect(nodeData).to.have.property('documentation', 'Adds two numbers together');

    } catch (error) {
      console.error("Error in test:", error);
      throw error;
    }
  });

  it("should create multiple nodes, fork them, and test search", async () => {
    const functions = require("../index");

    try {
      const mockAuth = {
        uid: "test-user",
        token: {}
      };

      // Create multiply node
      const multiplyResult = await functions.createNodeBlueprint.run({
        auth: mockAuth,
        data: { hint: "multiply" },
        rawRequest: {}
      });

      await functions.updateNodeBlueprintDocs.run({
        auth: mockAuth,
        data: {
          nodeId: multiplyResult.nodeId,
          title: "Multiply Numbers",
          docs: "Multiplies two numbers together"
        },
        rawRequest: {}
      });

      await functions.updateNodeBlueprintSpec.run({
        auth: mockAuth,
        data: {
          nodeId: multiplyResult.nodeId,
          newCode: `
            const a = inputs.a || 1;
            const b = inputs.b || 1;
            const result = a * b;
            outputs.set('result', result);
          `,
          newSpec: {
            input_sockets: {
              "a": { label: "Number A", documentation: "First number", type: "number" },
              "b": { label: "Number B", documentation: "Second number", type: "number" }
            },
            input_socket_order: ["a", "b"],
            output_sockets: {
              "result": { label: "Product", documentation: "A * B", type: "number" }
            },
            output_socket_order: ["result"]
          }
        },
        rawRequest: {}
      });

      // Create greyscale image node
      const greyscaleResult = await functions.createNodeBlueprint.run({
        auth: mockAuth,
        data: { hint: "greyscale" },
        rawRequest: {}
      });

      await functions.updateNodeBlueprintDocs.run({
        auth: mockAuth,
        data: {
          nodeId: greyscaleResult.nodeId,
          title: "Greyscale Image",
          docs: "Converts a color image to greyscale"
        },
        rawRequest: {}
      });

      await functions.updateNodeBlueprintSpec.run({
        auth: mockAuth,
        data: {
          nodeId: greyscaleResult.nodeId,
          newCode: `
            const img = inputs.img.clone();
            img.greyscale();
            outputs.set('img', img);
          `,
          newSpec: {
            input_sockets: {
              "img": { label: "Color Image", documentation: "Image to convert", type: "image/jimp" }
            },
            input_socket_order: ["img"],
            output_sockets: {
              "img": { label: "Greyscale Image", documentation: "Converted image", type: "image/jimp" }
            },
            output_socket_order: ["img"]
          }
        },
        rawRequest: {}
      });

      // Fork the multiply node
      const forkResult = await functions.forkNodeBlueprint.run({
        auth: mockAuth,
        data: { nodeId: multiplyResult.nodeId },
        rawRequest: {}
      });

      // Update the forked node
      await functions.updateNodeBlueprintDocs.run({
        auth: mockAuth,
        data: {
          nodeId: forkResult.nodeId,
          title: "Advanced Multiply",
          docs: "Enhanced multiplication with validation"
        },
        rawRequest: {}
      });

      await functions.updateNodeBlueprintSpec.run({
        auth: mockAuth,
        data: {
          nodeId: forkResult.nodeId,
          newCode: `
            const a = inputs.a || 1;
            const b = inputs.b || 1;
            if (typeof a !== 'number' || typeof b !== 'number') {
              throw new Error('Inputs must be numbers');
            }
            const result = a * b;
            outputs.set('result', result);
            outputs.set('validation', 'Input validation passed');
          `
        },
        rawRequest: {}
      });

      // Deploy the original multiply node
      await functions.deployNodeBlueprint.run({
        auth: mockAuth,
        data: { nodeId: multiplyResult.nodeId },
        rawRequest: {}
      });

      // Test search functionality - verify the search finds our created nodes
      const searchMultiply = await functions.searchNodeBlueprintsByText.run({
        auth: mockAuth,
        data: { substring: "multiply" },
        rawRequest: {}
      });
      
      expect(searchMultiply).to.have.property('results');
      expect(searchMultiply.results).to.be.an('array');
      expect(searchMultiply.results.length).to.be.greaterThan(0);

      const searchImage = await functions.searchNodeBlueprintsByText.run({
        auth: mockAuth,
        data: { substring: "image" },
        rawRequest: {}
      });
      
      expect(searchImage).to.have.property('results');
      expect(searchImage.results).to.be.an('array');
      expect(searchImage.results.length).to.be.greaterThan(0);

      const searchNumber = await functions.searchNodeBlueprintsByText.run({
        auth: mockAuth,
        data: { substring: "number" },
        rawRequest: {}
      });
      
      expect(searchNumber).to.have.property('results');
      expect(searchNumber.results).to.be.an('array');
      expect(searchNumber.results.length).to.be.greaterThan(0);

    } catch (error) {
      console.error("Error in comprehensive test:", error);
      throw error;
    }
  });

  it("should test node lifecycle: create, update, fork, deploy, search", async () => {
    const functions = require("../index");

    try {
      const mockAuth = {
        uid: "test-user-lifecycle",
        token: {}
      };


      // 1. Create initial node
      const createResult = await functions.createNodeBlueprint.run({
        auth: mockAuth,
        data: { hint: "text_processor" },
        rawRequest: {}
      });

      const originalNodeId = createResult.nodeId;

      // 2. Update documentation
      await functions.updateNodeBlueprintDocs.run({
        auth: mockAuth,
        data: {
          nodeId: originalNodeId,
          title: "Text Processor",
          docs: "Processes text input and transforms it"
        },
        rawRequest: {}
      });

      // 3. Update specification
      await functions.updateNodeBlueprintSpec.run({
        auth: mockAuth,
        data: {
          nodeId: originalNodeId,
          newCode: `
            const text = inputs.text || '';
            const processed = text.toUpperCase().trim();
            outputs.set('result', processed);
            outputs.set('length', processed.length);
          `,
          newSpec: {
            input_sockets: {
              "text": { label: "Input Text", documentation: "Text to process", type: "string" }
            },
            input_socket_order: ["text"],
            output_sockets: {
              "result": { label: "Processed Text", documentation: "Uppercase text", type: "string" },
              "length": { label: "Text Length", documentation: "Character count", type: "number" }
            },
            output_socket_order: ["result", "length"]
          }
        },
        rawRequest: {}
      });

      // 4. Fork the node
      const forkResult = await functions.forkNodeBlueprint.run({
        auth: mockAuth,
        data: { nodeId: originalNodeId },
        rawRequest: {}
      });

      const forkedNodeId = forkResult.nodeId;

      // 5. Update the fork
      await functions.updateNodeBlueprintDocs.run({
        auth: mockAuth,
        data: {
          nodeId: forkedNodeId,
          title: "Enhanced Text Processor",
          docs: "Advanced text processing with word counting"
        },
        rawRequest: {}
      });

      await functions.updateNodeBlueprintSpec.run({
        auth: mockAuth,
        data: {
          nodeId: forkedNodeId,
          newCode: `
            const text = inputs.text || '';
            const processed = text.toUpperCase().trim();
            const words = processed.split(/\\s+/).filter(w => w.length > 0);
            outputs.set('result', processed);
            outputs.set('length', processed.length);
            outputs.set('word_count', words.length);
            outputs.set('words', words);
          `
        },
        rawRequest: {}
      });

      // 6. Deploy original node
      await functions.deployNodeBlueprint.run({
        auth: mockAuth,
        data: { nodeId: originalNodeId },
        rawRequest: {}
      });

      // 7. Search for nodes
      const searchResults = await functions.searchNodeBlueprintsByText.run({
        auth: mockAuth,
        data: { substring: "text processor" },
        rawRequest: {}
      });

      // Verify search results
      expect(searchResults).to.have.property('results');
      expect(searchResults.results).to.be.an('array');

      // 8. Verify we can't update deployed node
      try {
        await functions.updateNodeBlueprintSpec.run({
          auth: mockAuth,
          data: {
            nodeId: originalNodeId,
            newCode: "// This should fail"
          },
          rawRequest: {}
        });
        expect.fail("Should not be able to update deployed node!");
      } catch (error) {
        // Expected - deployed nodes should be read-only
        expect(error.code).to.be.a('string');
      }

      // 9. Get final state of both nodes
      const originalData = await functions.getNodeBlueprint.run({
        auth: mockAuth,
        data: { nodeId: originalNodeId },
        rawRequest: {}
      });

      const forkedData = await functions.getNodeBlueprint.run({
        auth: mockAuth,
        data: { nodeId: forkedNodeId },
        rawRequest: {}
      });

      // Verify final node states
      expect(originalData).to.have.property('title');
      expect(originalData).to.have.property('is_deployed', true);
      expect(originalData).to.have.property('trust_level');
      
      expect(forkedData).to.have.property('title');
      expect(forkedData).to.have.property('is_deployed', false);
      expect(forkedData).to.have.property('trust_level');
      expect(forkedData).to.have.property('predecessor_nid', originalNodeId);

    } catch (error) {
      console.error("Error in lifecycle test:", error);
      throw error;
    }
  });

  it("should verify Firestore emulator data persistence", async () => {
    // Import Firebase Admin directly to check emulator data
    const { getFirestore } = require("firebase-admin/firestore");
    const { initializeApp, getApps } = require("firebase-admin/app");
    
    // Make sure we have an app initialized
    if (getApps().length === 0) {
      initializeApp();
    }
    
    const db = getFirestore();
    
    
    try {
      // Write test data directly to Firestore
      const testDoc = db.collection("test_verification").doc("direct_write");
      await testDoc.set({
        message: "Direct write to Firestore emulator",
        timestamp: new Date(),
        test_data: {
          number: 42,
          array: [1, 2, 3],
          nested: { value: "nested_value" }
        }
      });
      
      
      // Read it back
      const docSnapshot = await testDoc.get();
      if (docSnapshot.exists) {
        const data = docSnapshot.data();
        expect(data).to.have.property('message', 'Direct write to Firestore emulator');
        expect(data).to.have.property('test_data');
      } else {
        throw new Error("Test document not found in Firestore");
      }
      
      // List all collections to verify they exist
      const collections = await db.listCollections();
      expect(collections.length).to.be.greaterThan(0);
      
      // Check metadata collections specifically
      const nodesCollection = db.collection("nodes");
      const nodesDocs = await nodesCollection.limit(3).get();
      
      // Verify we can access node metadata
      if (nodesDocs.size > 0) {
        const firstNode = nodesDocs.docs[0];
        const metadataCollection = firstNode.ref.collection("metadata");
        const metadataDocs = await metadataCollection.get();
        // Metadata collection may or may not exist depending on test order
        expect(metadataDocs).to.be.an('object');
      }
      
    } catch (error) {
      console.error("ERROR: Firestore emulator verification failed:", error);
      throw error;
    }
  });
});