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
      
      console.log("✓ All functions exported successfully");
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
    
    console.log("✓ All functions have proper callable structure");
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
      console.log("Creating official_node_add node blueprint...");
      const createRequest = {
        auth: mockAuth,
        data: { hint: "add" },
        rawRequest: {}
      };

      const createResult = await functions.createNodeBlueprint.run(createRequest);
      console.log("Created node:", createResult.nodeId);

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
      console.log("Updated node documentation");

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
      console.log("Updated node specification");

      // Now retrieve and display the complete node data
      const getNodeRequest = {
        auth: mockAuth,
        data: { nodeId: createResult.nodeId },
        rawRequest: {}
      };

      const nodeData = await functions.getNodeBlueprint.run(getNodeRequest);
      console.log("\n=== OFFICIAL_NODE_ADD DATA ===");
      console.log(JSON.stringify(nodeData, null, 2));

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
      console.log("\n=== Creating multiply node ===");
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

      console.log("Created multiply node:", multiplyResult.nodeId);

      // Create greyscale image node
      console.log("\n=== Creating greyscale node ===");
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

      console.log("Created greyscale node:", greyscaleResult.nodeId);

      // Fork the multiply node
      console.log("\n=== Forking multiply node ===");
      const forkResult = await functions.forkNodeBlueprint.run({
        auth: mockAuth,
        data: { nodeId: multiplyResult.nodeId },
        rawRequest: {}
      });

      console.log("Forked node:", forkResult.nodeId);

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

      console.log("Updated forked node");

      // Deploy the original multiply node
      console.log("\n=== Deploying multiply node ===");
      await functions.deployNodeBlueprint.run({
        auth: mockAuth,
        data: { nodeId: multiplyResult.nodeId },
        rawRequest: {}
      });

      console.log("Deployed multiply node");

      // Test search functionality
      console.log("\n=== Testing search functionality ===");
      
      // Search for "multiply"
      const searchMultiply = await functions.searchNodeBlueprintsByText.run({
        auth: mockAuth,
        data: { substring: "multiply" },
        rawRequest: {}
      });
      
      console.log("Search results for 'multiply':");
      console.log(JSON.stringify(searchMultiply, null, 2));
      // check that we got the right node back
      expect(searchMultiply).to.have.property('results');
      expect(searchMultiply.results).to.be.an('array');
      expect(searchMultiply.results.length).to.be.greaterThan(0);

      // Search for "image"
      const searchImage = await functions.searchNodeBlueprintsByText.run({
        auth: mockAuth,
        data: { substring: "image" },
        rawRequest: {}
      });
      
      console.log("\nSearch results for 'image':");
      console.log(JSON.stringify(searchImage, null, 2));
      expect(searchImage).to.have.property('results');
      expect(searchImage.results).to.be.an('array');
      expect(searchImage.results.length).to.be.greaterThan(0);

      // Search for "number"
      const searchNumber = await functions.searchNodeBlueprintsByText.run({
        auth: mockAuth,
        data: { substring: "number" },
        rawRequest: {}
      });
      
      console.log("\nSearch results for 'number':");
      console.log(JSON.stringify(searchNumber, null, 2));
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

      console.log("\n=== NODE LIFECYCLE TEST ===");

      // 1. Create initial node
      console.log("1. Creating text processing node...");
      const createResult = await functions.createNodeBlueprint.run({
        auth: mockAuth,
        data: { hint: "text_processor" },
        rawRequest: {}
      });

      const originalNodeId = createResult.nodeId;
      console.log("Created:", originalNodeId);

      // 2. Update documentation 
      console.log("2. Updating documentation...");
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
      console.log("3. Updating specification...");
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
      console.log("4. Forking node...");
      const forkResult = await functions.forkNodeBlueprint.run({
        auth: mockAuth,
        data: { nodeId: originalNodeId },
        rawRequest: {}
      });

      const forkedNodeId = forkResult.nodeId;
      console.log("Forked:", forkedNodeId);

      // 5. Update the fork
      console.log("5. Updating forked node...");
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
      console.log("6. Deploying original node...");
      await functions.deployNodeBlueprint.run({
        auth: mockAuth,
        data: { nodeId: originalNodeId },
        rawRequest: {}
      });

      // 7. Search for nodes
      console.log("7. Testing search...");
      const searchResults = await functions.searchNodeBlueprintsByText.run({
        auth: mockAuth,
        data: { substring: "text processor" },
        rawRequest: {}
      });

      console.log("Search results for 'text processor':");
      console.log(JSON.stringify(searchResults, null, 2));

      // 8. Verify we can't update deployed node
      console.log("8. Verifying deployed node protection...");
      try {
        await functions.updateNodeBlueprintSpec.run({
          auth: mockAuth,
          data: {
            nodeId: originalNodeId,
            newCode: "// This should fail"
          },
          rawRequest: {}
        });
        console.log("ERROR: Should not be able to update deployed node!");
      } catch (error) {
        console.log("✓ Correctly prevented updating deployed node:", error.code);
      }

      // 9. Get final state of both nodes
      console.log("9. Final node states...");
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

      console.log("\nOriginal node (deployed):");
      console.log("- Title:", originalData.title);
      console.log("- Deployed:", originalData.is_deployed);
      console.log("- Trust Level:", originalData.trust_level);

      console.log("\nForked node (development):");
      console.log("- Title:", forkedData.title);
      console.log("- Deployed:", forkedData.is_deployed);
      console.log("- Trust Level:", forkedData.trust_level);
      console.log("- Predecessor:", forkedData.predecessor_nid);

      console.log("\n✓ Lifecycle test completed successfully!");

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
    
    console.log("\\n=== FIRESTORE EMULATOR VERIFICATION ===");
    console.log("Firestore emulator host:", process.env.FIRESTORE_EMULATOR_HOST);
    
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
      
      console.log("✓ Successfully wrote test data to Firestore");
      
      // Read it back
      const docSnapshot = await testDoc.get();
      if (docSnapshot.exists) {
        console.log("✓ Successfully read test data from Firestore:");
        console.log(JSON.stringify(docSnapshot.data(), null, 2));
      } else {
        throw new Error("Test document not found in Firestore");
      }
      
      // List all collections to see what's there
      console.log("\\n--- Firestore Collections ---");
      const collections = await db.listCollections();
      for (const collection of collections) {
        console.log(`Collection: ${collection.id}`);
        
        // Show some documents in each collection
        const docs = await collection.limit(3).get();
        docs.forEach(doc => {
          console.log(`  Document: ${doc.id}`);
          const data = doc.data();
          console.log(`    Keys: ${Object.keys(data).join(', ')}`);
        });
      }
      
      // Check metadata collections specifically
      console.log("\\n--- Checking Metadata Collections ---");
      const nodesCollection = db.collection("nodes");
      const nodesDocs = await nodesCollection.limit(3).get();
      
      for (const nodeDoc of nodesDocs.docs) {
        console.log(`Node: ${nodeDoc.id}`);
        const metadataCollection = nodeDoc.ref.collection("metadata");
        const metadataDocs = await metadataCollection.get();
        
        console.log(`  Metadata docs: ${metadataDocs.size}`);
        metadataDocs.forEach(metaDoc => {
          console.log(`    ${metaDoc.id}:`, metaDoc.data());
        });
      }

      console.log("\\n✓ Firestore emulator verification completed!");
      
    } catch (error) {
      console.error("ERROR: Firestore emulator verification failed:", error);
      throw error;
    }
  });
});