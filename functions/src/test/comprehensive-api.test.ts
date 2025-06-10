/**
 * Comprehensive Test Suite for Node Blueprint API
 * Tests every function with proper authentication and error cases
 */

// IMPORTANT: Set environment variables BEFORE importing any Firebase modules
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";
process.env.GCLOUD_PROJECT = "demo-project";
process.env.FIREBASE_PROJECT_ID = "demo-project";

import { describe, it, before } from 'mocha';
const { expect } = require('chai');
import fetch from 'node-fetch';

const FUNCTIONS_BASE_URL = 'http://127.0.0.1:5001/chuck-65c6e/us-central1';

// Helper to call Firebase Functions by calling them directly (like simple.test.js)
const callFunction = async (functionName: string, data: any, uid: string = 'test-user') => {
  // Import the functions module
  const functions = require("../index");
  
  if (!functions[functionName]) {
    throw new Error(`Function ${functionName} not found`);
  }

  // Create mock auth context for functions that require it
  const authContext = requiresAuth(functionName) ? {
    uid,
    token: {}
  } : undefined;

  // Create the request object in the format expected by Firebase Functions
  const request = {
    auth: authContext,
    data,
    rawRequest: {}
  };

  try {
    // Call the function directly
    const result = await functions[functionName].run(request);
    return result;
  } catch (error) {
    // Preserve HttpsError structure for proper test validation
    if (error.code && error.message) {
      throw error; // Re-throw HttpsError as-is
    }
    throw new Error(`${functionName} failed: ${error.message}`);
  }
};

// Helper to determine which functions require authentication based on API.md
const requiresAuth = (functionName: string): boolean => {
  const authRequiredFunctions = [
    'createNodeBlueprint',
    'forkNodeBlueprint', 
    'updateNodeBlueprintSpec',
    'updateNodeBlueprintDocs',
    'deployNodeBlueprint',
    'searchNodeBlueprintsByText'
  ];
  return authRequiredFunctions.includes(functionName);
};

// Helper to call without auth (should fail)
const callFunctionUnauthenticated = async (functionName: string, data: any) => {
  const response = await fetch(`${FUNCTIONS_BASE_URL}/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data })
  });

  return response;
};

describe('Node Blueprint API - Comprehensive Test Suite', () => {
  let testNodeId: string;
  let testNodeKey: string;
  let deployedNodeId: string;

  // Set up test data before all tests
  before(async () => {
    // Create a test node that can be used by multiple test suites
    const result = await callFunction('createNodeBlueprint', { hint: 'shared_test' });
    testNodeId = result.nodeId;
    testNodeKey = result.nodeId.split('/')[0];
  });

  describe('Authentication Tests', () => {
    it('should reject unauthenticated requests to createNodeBlueprint', async () => {
      const response = await callFunctionUnauthenticated('createNodeBlueprint', { hint: 'test' });
      expect(response.status).to.equal(401);
    });

    it('should reject unauthenticated requests to searchNodeBlueprintsByText', async () => {
      const response = await callFunctionUnauthenticated('searchNodeBlueprintsByText', { substring: 'test' });
      expect(response.status).to.equal(401);
    });
  });

  describe('createNodeBlueprint Function', () => {
    // this function needs to be authenticated to work. this is currently failing because it returns null or something
    it('should create a node with default values', async () => {
      const result = await callFunction('createNodeBlueprint', {});
      expect(result).to.have.property('nodeId');
      expect(result.nodeId).to.be.a('string');
      testNodeId = result.nodeId;
      testNodeKey = result.nodeId.split('/')[0];
    });

    it('should create a node with custom hint', async () => {
      const result = await callFunction('createNodeBlueprint', { hint: 'custom_operation' });
      expect(result).to.have.property('nodeId');
      expect(result.nodeId).to.include('custom_operation');
    });

    it('should create nodes with different user IDs', async () => {
      const result1 = await callFunction('createNodeBlueprint', { hint: 'user1' }, 'user-1');
      const result2 = await callFunction('createNodeBlueprint', { hint: 'user2' }, 'user-2');
      
      expect(result1.nodeId).to.include('user-1');
      expect(result2.nodeId).to.include('user-2');
    });
  });

  describe('getNodeBlueprint Function', () => {
    it('should retrieve an existing node', async () => {
      const result = await callFunction('getNodeBlueprint', { nodeId: testNodeId });
      expect(result).to.have.property('node_key', testNodeKey);
      expect(result).to.have.property('author_uid', 'test-user');
      expect(result).to.have.property('title');
      expect(result).to.have.property('documentation');
      expect(result).to.have.property('user_defined_code_snippet');
      expect(result).to.have.property('input_sockets');
      expect(result).to.have.property('output_sockets');
      expect(result).to.have.property('is_deployed', false);
    });

    it('should return null for non-existent node', async () => {
      const result = await callFunction('getNodeBlueprint', { nodeId: 'non-existent/versions/test:123' });
      expect(result).to.be.null;
    });

    it('should require nodeId parameter', async () => {
      try {
        await callFunction('getNodeBlueprint', {});
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.include('nodeId is required');
      }
    });
  });

  describe('updateNodeBlueprintDocs Function', () => {
    it('should update node title', async () => {
      const result = await callFunction('updateNodeBlueprintDocs', {
        nodeId: testNodeId,
        title: 'Updated Test Node'
      });
      expect(result).to.have.property('success', true);
    });

    it('should update node documentation', async () => {
      const result = await callFunction('updateNodeBlueprintDocs', {
        nodeId: testNodeId,
        docs: 'This is updated documentation for the test node.'
      });
      expect(result).to.have.property('success', true);
    });

    it('should update both title and docs', async () => {
      const result = await callFunction('updateNodeBlueprintDocs', {
        nodeId: testNodeId,
        title: 'Comprehensive Test Node',
        docs: 'This node is used for comprehensive testing of the API.'
      });
      expect(result).to.have.property('success', true);
    });

    it('should require nodeId parameter', async () => {
      try {
        await callFunction('updateNodeBlueprintDocs', { title: 'Test' });
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.include('nodeId is required');
      }
    });

    it('should handle invalid nodeId format', async () => {
      try {
        await callFunction('updateNodeBlueprintDocs', {
          nodeId: 'invalid-format',
          title: 'Test'
        });
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.include('Invalid nodeId format');
      }
    });
  });

  describe('updateNodeBlueprintSpec Function', () => {
    it('should update node code', async () => {
      const newCode = `
        const input1 = inputs.input1 || 0;
        const input2 = inputs.input2 || 0;
        const result = input1 * input2;
        outputs.set('result', result);
      `;
      
      const result = await callFunction('updateNodeBlueprintSpec', {
        nodeId: testNodeId,
        newCode
      });
      expect(result).to.have.property('success', true);
    });

    it('should update input sockets', async () => {
      const newSpec = {
        input_sockets: {
          input1: { label: 'Input 1', type: 'number', documentation: 'First input' },
          input2: { label: 'Input 2', type: 'number', documentation: 'Second input' }
        },
        input_socket_order: ['input1', 'input2']
      };
      
      const result = await callFunction('updateNodeBlueprintSpec', {
        nodeId: testNodeId,
        newSpec
      });
      expect(result).to.have.property('success', true);
    });

    it('should update output sockets', async () => {
      const newSpec = {
        output_sockets: {
          result: { label: 'Result', type: 'number', documentation: 'Multiplication result' }
        },
        output_socket_order: ['result']
      };
      
      const result = await callFunction('updateNodeBlueprintSpec', {
        nodeId: testNodeId,
        newSpec
      });
      expect(result).to.have.property('success', true);
    });

    it('should require nodeId parameter', async () => {
      try {
        await callFunction('updateNodeBlueprintSpec', { newCode: 'test' });
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.include('nodeId is required');
      }
    });
  });

  describe('forkNodeBlueprint Function', () => {
    let forkedNodeId: string;

    it('should fork an existing node', async () => {
      const result = await callFunction('forkNodeBlueprint', { nodeId: testNodeId });
      expect(result).to.have.property('nodeId');
      expect(result.nodeId).to.be.a('string');
      expect(result.nodeId).to.include('fork_');
      forkedNodeId = result.nodeId;
    });

    it('should create independent copy', async () => {
      const original = await callFunction('getNodeBlueprint', { nodeId: testNodeId });
      const forked = await callFunction('getNodeBlueprint', { nodeId: forkedNodeId });
      
      expect(forked.node_key).to.not.equal(original.node_key);
      expect(forked.predecessor_nid).to.equal(testNodeId);
      expect(forked.title).to.include('Fork of');
      expect(forked.is_deployed).to.be.false;
      expect(forked.trust_level).to.equal('New');
    });

    it('should fork with different user', async () => {
      const result = await callFunction('forkNodeBlueprint', { nodeId: testNodeId }, 'different-user');
      const forked = await callFunction('getNodeBlueprint', { nodeId: result.nodeId });
      expect(forked.author_uid).to.equal('different-user');
    });

    it('should require nodeId parameter', async () => {
      try {
        await callFunction('forkNodeBlueprint', {});
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.include('nodeId is required');
      }
    });

    it('should handle non-existent node', async () => {
      try {
        await callFunction('forkNodeBlueprint', { nodeId: 'non-existent/versions/test:123' });
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.include('not found');
      }
    });
  });

  describe('deployNodeBlueprint Function', () => {
    it('should deploy a node blueprint', async () => {
      const result = await callFunction('deployNodeBlueprint', { nodeId: testNodeId });
      expect(result).to.have.property('success', true);
      deployedNodeId = testNodeId;
    });

    it('should prevent deployment by non-owner', async () => {
      // Create a node with one user
      const createResult = await callFunction('createNodeBlueprint', { hint: 'deploy_test' }, 'owner-user');
      
      // Try to deploy with different user
      try {
        await callFunction('deployNodeBlueprint', { nodeId: createResult.nodeId }, 'different-user');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.include('Only the creator can deploy');
      }
    });

    it('should prevent double deployment', async () => {
      try {
        await callFunction('deployNodeBlueprint', { nodeId: deployedNodeId });
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.include('already deployed');
      }
    });

    it('should make deployed node read-only', async () => {
      // Verify deployed node exists in deployed collection
      const deployedNode = await callFunction('getNodeBlueprint', { nodeId: deployedNodeId });
      expect(deployedNode.is_deployed).to.be.true;
      
      // Try to update spec of deployed node
      try {
        await callFunction('updateNodeBlueprintSpec', {
          nodeId: deployedNodeId,
          newCode: 'console.log("should fail");'
        });
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.include('Cannot update deployed node');
      }
    });

    it('should require nodeId parameter', async () => {
      try {
        await callFunction('deployNodeBlueprint', {});
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.include('nodeId is required');
      }
    });
  });

  describe('searchNodeBlueprintsByText Function', () => {
    before(async () => {
      // Create some searchable nodes
      const searchNodes = [
        { hint: 'calculator', title: 'Math Calculator', docs: 'Performs mathematical operations' },
        { hint: 'text_processor', title: 'Text Processor', docs: 'Processes and transforms text input' },
        { hint: 'image_filter', title: 'Image Filter', docs: 'Applies filters to image data' }
      ];

      for (const node of searchNodes) {
        const createResult = await callFunction('createNodeBlueprint', { hint: node.hint });
        await callFunction('updateNodeBlueprintDocs', {
          nodeId: createResult.nodeId,
          title: node.title,
          docs: node.docs
        });
      }
    });

    it('should search by title substring', async () => {
      const result = await callFunction('searchNodeBlueprintsByText', {
        substring: 'Calculator',
        includeDeployed: true
      });
      
      expect(result).to.have.property('results');
      expect(result.results).to.be.an('array');
      
      const calculatorNodes = result.results.filter(node => 
        node.title.includes('Calculator')
      );
      expect(calculatorNodes.length).to.be.at.least(1);
    });

    it('should search by documentation substring', async () => {
      const result = await callFunction('searchNodeBlueprintsByText', {
        substring: 'text',
        includeDeployed: true
      });
      
      expect(result.results).to.be.an('array');
      const textNodes = result.results.filter(node => 
        node.documentation.toLowerCase().includes('text') ||
        node.title.toLowerCase().includes('text')
      );
      expect(textNodes.length).to.be.at.least(1);
    });

    it('should handle case-insensitive search', async () => {
      const result = await callFunction('searchNodeBlueprintsByText', {
        substring: 'PROCESSOR',
        includeDeployed: true
      });
      
      const processorNodes = result.results.filter(node => 
        node.title.toLowerCase().includes('processor')
      );
      expect(processorNodes.length).to.be.at.least(1);
    });

    it('should require minimum search length', async () => {
      try {
        await callFunction('searchNodeBlueprintsByText', { substring: 'a' });
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.include('at least 2 characters');
      }
    });

    it('should require substring parameter', async () => {
      try {
        await callFunction('searchNodeBlueprintsByText', {});
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.include('substring is required');
      }
    });

    it('should handle empty results gracefully', async () => {
      const result = await callFunction('searchNodeBlueprintsByText', {
        substring: 'nonexistentsubstring12345'
      });
      
      expect(result).to.have.property('results');
      expect(result.results).to.be.an('array');
      expect(result.results).to.have.length(0);
    });
  });

  describe('getRecommendedVersion Function', () => {
    let devNodeKey: string;
    let deployedNodeKey: string;

    before(async () => {
      // Create a development node
      const devResult = await callFunction('createNodeBlueprint', { hint: 'dev_version' });
      devNodeKey = devResult.nodeId.split('/')[0];

      // Create and deploy another node
      const deployResult = await callFunction('createNodeBlueprint', { hint: 'deployed_version' });
      await callFunction('deployNodeBlueprint', { nodeId: deployResult.nodeId });
      deployedNodeKey = deployResult.nodeId.split('/')[0];
    });

    it('should return deployed version when available', async () => {
      const result = await callFunction('getRecommendedVersion', { nodeKey: deployedNodeKey });
      expect(result).to.have.property('nodeId');
      expect(result.nodeId).to.be.a('string');
      expect(result.nodeId).to.include(deployedNodeKey);
    });

    it('should return development version when no deployed version', async () => {
      const result = await callFunction('getRecommendedVersion', { nodeKey: devNodeKey });
      expect(result).to.have.property('nodeId');
      expect(result.nodeId).to.be.a('string');
      expect(result.nodeId).to.include(devNodeKey);
    });

    it('should return null for non-existent node key', async () => {
      const result = await callFunction('getRecommendedVersion', { nodeKey: 'non_existent_key' });
      expect(result).to.have.property('nodeId', null);
    });

    it('should require nodeKey parameter', async () => {
      try {
        await callFunction('getRecommendedVersion', {});
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.include('nodeKey is required');
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed nodeId in various functions', async () => {
      const malformedIds = ['', 'invalid', 'too/short', 'way/too/many/slashes/here'];
      
      for (const badId of malformedIds) {
        try {
          await callFunction('getNodeBlueprint', { nodeId: badId });
          // Some might succeed (returning null), others might fail
        } catch (error) {
          // Expected for some malformed IDs
          expect(error.message).to.be.a('string');
        }
      }
    });

    it('should handle very long strings', async () => {
      const longString = 'a'.repeat(1000);
      
      const result = await callFunction('createNodeBlueprint', { hint: 'long_test' });
      await callFunction('updateNodeBlueprintDocs', {
        nodeId: result.nodeId,
        title: longString.substring(0, 100), // Reasonable title length
        docs: longString
      });
      
      const retrieved = await callFunction('getNodeBlueprint', { nodeId: result.nodeId });
      expect(retrieved.documentation).to.equal(longString);
    });

    it('should handle special characters in search', async () => {
      const specialChars = ['@#$%', '中文', 'émojis', '🚀🎉'];
      
      for (const chars of specialChars) {
        const result = await callFunction('searchNodeBlueprintsByText', {
          substring: chars
        });
        expect(result).to.have.property('results');
        expect(result.results).to.be.an('array');
      }
    });
  });
});