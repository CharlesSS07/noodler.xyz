/**
 * Integration tests for Firebase Functions calling actual emulator endpoints
 * These tests verify the complete flow from HTTP request through to Firestore storage
 */

const chai = require("chai");
const expect = chai.expect;

describe("Node Blueprint API Integration", () => {
  const FUNCTIONS_BASE_URL = "http://127.0.0.1:5001/chuck-65c6e/us-central1";
  const fetch = require('node-fetch');
  
  // Standard headers for Firebase callable functions
  const headers = { 'Content-Type': 'application/json' };
  
  // Helper to create proper Firebase callable function payload
  const createPayload = (data: any) => ({ data });
  
  // Helper to make function calls with error handling
  const callFunction = async (functionName: string, data: any) => {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/${functionName}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(createPayload(data))
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${functionName} failed (${response.status}): ${errorText}`);
    }

    return response.json();
  };

  // Test basic node creation through the complete API flow
  it("should create and configure a node blueprint", async () => {
    // Step 1: Create new node
    const createResult = await callFunction("createNodeBlueprint", {
      hint: "add_numbers"
    });
    
    expect(createResult).to.have.property("result");
    expect(createResult.result).to.have.property("nodeId");
    const nodeId = createResult.result.nodeId;
    
    // Step 2: Update documentation 
    const updateDocsResult = await callFunction("updateNodeBlueprintDocs", {
      nodeId: nodeId,
      title: "Add Two Numbers",
      docs: "This node adds two numbers together and returns the sum."
    });
    expect(updateDocsResult.result).to.have.property("success", true);
    
    // Step 3: Update specification
    const updateSpecResult = await callFunction("updateNodeBlueprintSpec", {
      nodeId: nodeId,
      newCode: `
        const a = Number(inputs.a) || 0;
        const b = Number(inputs.b) || 0;
        const result = a + b;
        outputs.set('result', result);
      `,
      newSpec: {
        input_sockets: {
          "a": { label: "First Number", documentation: "The first number to add", type: "number" },
          "b": { label: "Second Number", documentation: "The second number to add", type: "number" }
        },
        input_socket_order: ["a", "b"],
        output_sockets: {
          "sum": { label: "Sum", documentation: "The result of a + b", type: "number" }
        },
        output_socket_order: ["sum"]
      }
    });
    expect(updateSpecResult.result).to.have.property("success", true);
    
    // Step 4: Verify final node data
    const nodeData = await callFunction("getNodeBlueprint", { nodeId });
    expect(nodeData.result).to.have.property("node_key");
    expect(nodeData.result).to.have.property("input_sockets");
    expect(nodeData.result).to.have.property("output_sockets");
  });

  // Test node forking functionality
  it("should fork an existing node blueprint", async () => {
    // First create a node to fork
    const createResult = await callFunction("createNodeBlueprint", { hint: "multiply" });
    const originalNodeId = createResult.result.nodeId;
    
    // Configure the original node
    await callFunction("updateNodeBlueprintDocs", {
      nodeId: originalNodeId,
      title: "Multiply Numbers",
      docs: "Multiplies two numbers"
    });
    
    // Fork the node
    const forkResult = await callFunction("forkNodeBlueprint", {
      nodeId: originalNodeId
    });
    
    expect(forkResult.result).to.have.property("nodeId");
    const forkedNodeId = forkResult.result.nodeId;
    expect(forkedNodeId).to.include("fork_");
    
    // Verify forked node has predecessor reference
    const forkedNodeData = await callFunction("getNodeBlueprint", { nodeId: forkedNodeId });
    expect(forkedNodeData.result).to.have.property("predecessor_nid", originalNodeId);
    expect(forkedNodeData.result.title).to.include("Fork of");
  });
  
  // Test node deployment and protection
  it("should deploy a node and prevent further modifications", async () => {
    // Create and configure a node
    const createResult = await callFunction("createNodeBlueprint", { hint: "divide" });
    const nodeId = createResult.result.nodeId;
    
    await callFunction("updateNodeBlueprintDocs", {
      nodeId: nodeId,
      title: "Divide Numbers",
      docs: "Divides two numbers"
    });
    
    // Deploy the node
    const deployResult = await callFunction("deployNodeBlueprint", { nodeId });
    expect(deployResult.result).to.have.property("success", true);
    
    // Verify node is marked as deployed
    const deployedNodeData = await callFunction("getNodeBlueprint", { nodeId });
    expect(deployedNodeData.result).to.have.property("is_deployed", true);
    
    // Attempt to modify deployed node should fail
    try {
      await callFunction("updateNodeBlueprintSpec", {
        nodeId: nodeId,
        newCode: "// This should fail"
      });
      expect.fail("Should not be able to update deployed node");
    } catch (error) {
      expect(error.message).to.include("Cannot update deployed node");
    }
  });
  
  // Test search functionality
  it("should search for nodes by text", async () => {
    const searchResult = await callFunction("searchNodeBlueprintsByText", {
      substring: "number"
    });
    
    expect(searchResult.result).to.have.property("results");
    expect(searchResult.result.results).to.be.an("array");
  });
  
  // Test getting recommended version
  it("should get recommended version for node key", async () => {
    const result = await callFunction("getRecommendedVersion", {
      nodeKey: "nonexistent_node"
    });
    
    expect(result.result).to.have.property("nodeId");
    // Should return null for non-existent node
    expect(result.result.nodeId).to.be.null;
  });
  
  // Test complete node lifecycle: create -> update -> fork -> deploy
  it("should handle complete node lifecycle", async () => {
    // Create base node
    const createResult = await callFunction("createNodeBlueprint", { hint: "power" });
    const originalNodeId = createResult.result.nodeId;
    
    // Configure base node
    await callFunction("updateNodeBlueprintDocs", {
      nodeId: originalNodeId,
      title: "Power Function",
      docs: "Raises a number to a power"
    });
    
    await callFunction("updateNodeBlueprintSpec", {
      nodeId: originalNodeId,
      newCode: `
        const base = Number(inputs.base) || 0;
        const exponent = Number(inputs.exponent) || 1;
        const result = Math.pow(base, exponent);
        outputs.set('result', result);
      `,
      newSpec: {
        input_sockets: {
          "base": { label: "Base", documentation: "Number to raise", type: "number" },
          "exponent": { label: "Exponent", documentation: "Power to raise to", type: "number" }
        },
        input_socket_order: ["base", "exponent"],
        output_sockets: {
          "result": { label: "Result", documentation: "Base raised to exponent", type: "number" }
        },
        output_socket_order: ["result"]
      }
    });
    
    // Fork the node
    const forkResult = await callFunction("forkNodeBlueprint", { nodeId: originalNodeId });
    const forkedNodeId = forkResult.result.nodeId;
    
    // Enhance the forked node
    await callFunction("updateNodeBlueprintDocs", {
      nodeId: forkedNodeId,
      title: "Enhanced Power Function",
      docs: "Power function with input validation"
    });
    
    // Deploy the original node
    await callFunction("deployNodeBlueprint", { nodeId: originalNodeId });
    
    // Verify the lifecycle results
    const originalNode = await callFunction("getNodeBlueprint", { nodeId: originalNodeId });
    const forkedNode = await callFunction("getNodeBlueprint", { nodeId: forkedNodeId });
    
    expect(originalNode.result.is_deployed).to.be.true;
    expect(forkedNode.result.is_deployed).to.be.false;
    expect(forkedNode.result.predecessor_nid).to.equal(originalNodeId);
    expect(forkedNode.result.title).to.include("Enhanced");
  });
});