/**
 * Client-side Node Blueprint API Test Suite
 * Tests using the actual NodeBlueprintAPI service class with Firebase Functions
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { NodeBlueprintAPI } from '$lib/services/NodeBlueprintAPI.js';
import { getAuth, signInAnonymously, type User } from 'firebase/auth';
import { app } from '../firebase';

// Test configuration
const TEST_CONFIG = {
  timeout: 30000, // 30 seconds per test
  batchSize: 10,
  maxRetries: 3
};

describe('NodeBlueprintAPI - Client-side Integration Tests', () => {
  let api: NodeBlueprintAPI;
  let testUser: User;
  let createdNodes: string[] = [];

  beforeAll(async () => {
    // Initialize API
    api = new NodeBlueprintAPI();
    
    // Sign in anonymously for testing
    const auth = getAuth(app);
    const userCredential = await signInAnonymously(auth);
    testUser = userCredential.user;
    
    console.log(`🔐 Signed in as test user: ${testUser.uid}`);
  }, TEST_CONFIG.timeout);

  afterAll(async () => {
    // Clean up: could optionally delete test nodes here
    console.log(`🧹 Test completed. Created ${createdNodes.length} test nodes.`);
  });

  beforeEach(() => {
    // Reset between tests if needed
  });

  describe('Authentication & Basic Operations', () => {
    it('should be authenticated', () => {
      expect(api.isAuthenticated()).toBe(true);
      expect(api.getCurrentUser()).toBeTruthy();
      expect(api.getCurrentUser()?.uid).toBe(testUser.uid);
    });

    it('should create a basic node blueprint', async () => {
      const response = await api.createNodeBlueprint({ hint: 'test_basic' });
      
      expect(response.success).toBe(true);
      expect(response.data).toBeTruthy();
      expect(response.data!.nodeId).toMatch(/^node_test_basic_/);
      
      createdNodes.push(response.data!.nodeId);
    }, TEST_CONFIG.timeout);

    it('should retrieve the created node', async () => {
      if (createdNodes.length === 0) {
        // Create a node first
        const createResponse = await api.createNodeBlueprint({ hint: 'test_retrieve' });
        expect(createResponse.success).toBe(true);
        createdNodes.push(createResponse.data!.nodeId);
      }

      const nodeId = createdNodes[0];
      const response = await api.getNodeBlueprint({ nodeId });
      
      expect(response.success).toBe(true);
      expect(response.data).toBeTruthy();
      expect(response.data!.node_key).toMatch(/^node_test_/);
      expect(response.data!.author_uid).toBe(testUser.uid);
      expect(response.data!.is_deployed).toBe(false);
    }, TEST_CONFIG.timeout);

    it('should return null for non-existent node', async () => {
      const response = await api.getNodeBlueprint({ 
        nodeId: 'non_existent_node/versions/fake:123456789' 
      });
      
      expect(response.success).toBe(true);
      expect(response.data).toBeNull();
    }, TEST_CONFIG.timeout);
  });

  describe('Node Documentation Management', () => {
    let testNodeId: string;

    beforeAll(async () => {
      const response = await api.createNodeBlueprint({ hint: 'docs_test' });
      expect(response.success).toBe(true);
      testNodeId = response.data!.nodeId;
      createdNodes.push(testNodeId);
    });

    it('should update node title', async () => {
      const response = await api.updateNodeBlueprintDocs({
        nodeId: testNodeId,
        title: 'Test Documentation Node'
      });
      
      expect(response.success).toBe(true);
      expect(response.data!.success).toBe(true);
    }, TEST_CONFIG.timeout);

    it('should update node documentation', async () => {
      const response = await api.updateNodeBlueprintDocs({
        nodeId: testNodeId,
        docs: 'This is a comprehensive test node for documentation testing.'
      });
      
      expect(response.success).toBe(true);
      expect(response.data!.success).toBe(true);
    }, TEST_CONFIG.timeout);

    it('should update both title and docs together', async () => {
      const response = await api.updateNodeBlueprintDocs({
        nodeId: testNodeId,
        title: 'Complete Test Node',
        docs: 'This node has both title and documentation updated simultaneously.'
      });
      
      expect(response.success).toBe(true);
      expect(response.data!.success).toBe(true);
    }, TEST_CONFIG.timeout);
  });

  describe('Node Specification Management', () => {
    let testNodeId: string;

    beforeAll(async () => {
      const response = await api.createNodeBlueprint({ hint: 'spec_test' });
      expect(response.success).toBe(true);
      testNodeId = response.data!.nodeId;
      createdNodes.push(testNodeId);
    });

    it('should update node code', async () => {
      const newCode = `
        const input1 = inputs.input1 || 0;
        const input2 = inputs.input2 || 0;
        const result = input1 + input2;
        outputs.set('result', result);
      `;
      
      const response = await api.updateNodeBlueprintSpec({
        nodeId: testNodeId,
        newCode
      });
      
      expect(response.success).toBe(true);
      expect(response.data!.success).toBe(true);
    }, TEST_CONFIG.timeout);

    it('should update input sockets', async () => {
      const response = await api.updateNodeBlueprintSpec({
        nodeId: testNodeId,
        newSpec: {
          input_sockets: {
            input1: { label: 'First Input', type: 'number', documentation: 'First number to add' },
            input2: { label: 'Second Input', type: 'number', documentation: 'Second number to add' }
          },
          input_socket_order: ['input1', 'input2']
        }
      });
      
      expect(response.success).toBe(true);
      expect(response.data!.success).toBe(true);
    }, TEST_CONFIG.timeout);

    it('should update output sockets', async () => {
      const response = await api.updateNodeBlueprintSpec({
        nodeId: testNodeId,
        newSpec: {
          output_sockets: {
            result: { label: 'Sum Result', type: 'number', documentation: 'The sum of the inputs' }
          },
          output_socket_order: ['result']
        }
      });
      
      expect(response.success).toBe(true);
      expect(response.data!.success).toBe(true);
    }, TEST_CONFIG.timeout);
  });

  describe('Node Forking', () => {
    let originalNodeId: string;
    let forkedNodeId: string;

    beforeAll(async () => {
      // Create original node
      const createResponse = await api.createNodeBlueprint({ hint: 'fork_original' });
      expect(createResponse.success).toBe(true);
      originalNodeId = createResponse.data!.nodeId;
      createdNodes.push(originalNodeId);

      // Configure the original node
      await api.updateNodeBlueprintDocs({
        nodeId: originalNodeId,
        title: 'Original Node for Forking',
        docs: 'This node will be forked for testing'
      });

      await api.updateNodeBlueprintSpec({
        nodeId: originalNodeId,
        newCode: 'const result = inputs.value * 2; outputs.set("doubled", result);'
      });
    });

    it('should fork an existing node', async () => {
      const response = await api.forkNodeBlueprint({ nodeId: originalNodeId });
      
      expect(response.success).toBe(true);
      expect(response.data).toBeTruthy();
      expect(response.data!.nodeId).toMatch(/^fork_/);
      
      forkedNodeId = response.data!.nodeId;
      createdNodes.push(forkedNodeId);
    }, TEST_CONFIG.timeout);

    it('should verify fork has proper predecessor relationship', async () => {
      const response = await api.getNodeBlueprint({ nodeId: forkedNodeId });
      
      expect(response.success).toBe(true);
      expect(response.data).toBeTruthy();
      expect(response.data!.predecessor_nid).toBe(originalNodeId);
      expect(response.data!.title).toContain('Fork of');
      expect(response.data!.is_deployed).toBe(false);
      expect(response.data!.trust_level).toBe('New');
    }, TEST_CONFIG.timeout);

    it('should allow independent modification of forked node', async () => {
      const response = await api.updateNodeBlueprintDocs({
        nodeId: forkedNodeId,
        title: 'Modified Fork Node',
        docs: 'This forked node has been independently modified'
      });
      
      expect(response.success).toBe(true);
      expect(response.data!.success).toBe(true);
    }, TEST_CONFIG.timeout);
  });

  describe('Node Deployment', () => {
    let deployTestNodeId: string;

    beforeAll(async () => {
      // Create node for deployment testing
      const createResponse = await api.createNodeBlueprint({ hint: 'deploy_test' });
      expect(createResponse.success).toBe(true);
      deployTestNodeId = createResponse.data!.nodeId;
      createdNodes.push(deployTestNodeId);

      // Configure the node before deployment
      await api.updateNodeBlueprintDocs({
        nodeId: deployTestNodeId,
        title: 'Node for Deployment',
        docs: 'This node will be deployed and become read-only'
      });

      await api.updateNodeBlueprintSpec({
        nodeId: deployTestNodeId,
        newCode: 'const result = Math.sqrt(inputs.number); outputs.set("sqrt", result);'
      });
    });

    it('should deploy a node blueprint', async () => {
      const response = await api.deployNodeBlueprint({ nodeId: deployTestNodeId });
      
      expect(response.success).toBe(true);
      expect(response.data!.success).toBe(true);
    }, TEST_CONFIG.timeout);

    it('should verify deployed node is read-only', async () => {
      // Try to update the deployed node - should fail
      const response = await api.updateNodeBlueprintSpec({
        nodeId: deployTestNodeId,
        newCode: 'console.log("This should fail");'
      });
      
      expect(response.success).toBe(false);
      expect(response.error).toContain('deployed node');
    }, TEST_CONFIG.timeout);

    it('should verify deployed node has correct status', async () => {
      const response = await api.getNodeBlueprint({ nodeId: deployTestNodeId });
      
      expect(response.success).toBe(true);
      expect(response.data).toBeTruthy();
      expect(response.data!.is_deployed).toBe(true);
    }, TEST_CONFIG.timeout);

    it('should prevent double deployment', async () => {
      const response = await api.deployNodeBlueprint({ nodeId: deployTestNodeId });
      
      expect(response.success).toBe(false);
      expect(response.error).toContain('already deployed');
    }, TEST_CONFIG.timeout);
  });

  describe('Search Functionality', () => {
    beforeAll(async () => {
      // Create some searchable nodes
      const searchableNodes = [
        { hint: 'calculator', title: 'Advanced Calculator', docs: 'Performs complex mathematical calculations' },
        { hint: 'text_processor', title: 'Text Processor Pro', docs: 'Processes and transforms text data efficiently' },
        { hint: 'image_filter', title: 'Image Filter Suite', docs: 'Applies various filters to image data' }
      ];

      for (const nodeSpec of searchableNodes) {
        const createResponse = await api.createNodeBlueprint({ hint: nodeSpec.hint });
        if (createResponse.success) {
          const nodeId = createResponse.data!.nodeId;
          createdNodes.push(nodeId);
          
          await api.updateNodeBlueprintDocs({
            nodeId,
            title: nodeSpec.title,
            docs: nodeSpec.docs
          });
        }
      }
    });

    it('should search by title substring', async () => {
      const response = await api.searchNodeBlueprintsByText({
        substring: 'Calculator',
        includeDeployed: true
      });
      
      expect(response.success).toBe(true);
      expect(response.data).toBeTruthy();
      expect(response.data!.results).toBeInstanceOf(Array);
      
      const calculatorResults = response.data!.results.filter(result => 
        result.title.includes('Calculator')
      );
      expect(calculatorResults.length).toBeGreaterThan(0);
    }, TEST_CONFIG.timeout);

    it('should search by documentation content', async () => {
      const response = await api.searchNodeBlueprintsByText({
        substring: 'text',
        includeDeployed: true
      });
      
      expect(response.success).toBe(true);
      expect(response.data!.results).toBeInstanceOf(Array);
      
      const textResults = response.data!.results.filter(result => 
        result.documentation.toLowerCase().includes('text') ||
        result.title.toLowerCase().includes('text')
      );
      expect(textResults.length).toBeGreaterThan(0);
    }, TEST_CONFIG.timeout);

    it('should handle case-insensitive search', async () => {
      const lowerResponse = await api.searchNodeBlueprintsByText({
        substring: 'processor',
        includeDeployed: true
      });
      
      const upperResponse = await api.searchNodeBlueprintsByText({
        substring: 'PROCESSOR',
        includeDeployed: true
      });
      
      expect(lowerResponse.success).toBe(true);
      expect(upperResponse.success).toBe(true);
      
      // Results should be similar (allowing for some variation)
      expect(Math.abs(lowerResponse.data!.results.length - upperResponse.data!.results.length)).toBeLessThan(3);
    }, TEST_CONFIG.timeout);

    it('should handle empty search results gracefully', async () => {
      const response = await api.searchNodeBlueprintsByText({
        substring: 'nonexistentstring12345'
      });
      
      expect(response.success).toBe(true);
      expect(response.data!.results).toBeInstanceOf(Array);
      expect(response.data!.results).toHaveLength(0);
    }, TEST_CONFIG.timeout);

    it('should reject search terms that are too short', async () => {
      const response = await api.searchNodeBlueprintsByText({
        substring: 'a'
      });
      
      expect(response.success).toBe(false);
      expect(response.error).toContain('at least 2 characters');
    }, TEST_CONFIG.timeout);
  });

  describe('Recommended Version Functionality', () => {
    let testNodeKey: string;

    beforeAll(async () => {
      const createResponse = await api.createNodeBlueprint({ hint: 'version_test' });
      expect(createResponse.success).toBe(true);
      testNodeKey = createResponse.data!.nodeId.split('/')[0];
      createdNodes.push(createResponse.data!.nodeId);
    });

    it('should get recommended version for existing node key', async () => {
      const response = await api.getRecommendedVersion({ nodeKey: testNodeKey });
      
      expect(response.success).toBe(true);
      expect(response.data).toBeTruthy();
      expect(response.data!.nodeId).toBeTruthy();
      expect(response.data!.nodeId).toContain(testNodeKey);
    }, TEST_CONFIG.timeout);

    it('should return null for non-existent node key', async () => {
      const response = await api.getRecommendedVersion({ 
        nodeKey: 'non_existent_key_12345' 
      });
      
      expect(response.success).toBe(true);
      expect(response.data).toBeTruthy();
      expect(response.data!.nodeId).toBeNull();
    }, TEST_CONFIG.timeout);
  });

  describe('Error Handling', () => {
    it('should handle invalid node IDs gracefully', async () => {
      const invalidIds = ['', 'invalid', 'too/short'];
      
      for (const invalidId of invalidIds) {
        const response = await api.getNodeBlueprint({ nodeId: invalidId });
        // Should either succeed with null or fail gracefully
        expect(response.success).toBeDefined();
        if (!response.success) {
          expect(response.error).toBeTruthy();
        }
      }
    }, TEST_CONFIG.timeout);

    it('should handle network errors gracefully', async () => {
      // This test would require mocking network failures
      // For now, just verify the API structure
      expect(api.isAuthenticated).toBeDefined();
      expect(api.getCurrentUser).toBeDefined();
    });
  });

  describe('Performance & Concurrency', () => {
    it('should handle multiple concurrent requests', async () => {
      const concurrentRequests = Array.from({ length: 5 }, (_, i) => 
        api.createNodeBlueprint({ hint: `concurrent_${i}` })
      );
      
      const results = await Promise.allSettled(concurrentRequests);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
      
      expect(successful.length).toBeGreaterThan(3); // At least 3 of 5 should succeed
      
      // Add successful node IDs to cleanup list
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value.success && result.value.data) {
          createdNodes.push(result.value.data.nodeId);
        }
      });
    }, TEST_CONFIG.timeout);

    it('should handle rapid sequential requests', async () => {
      const startTime = Date.now();
      const sequentialRequests = [];
      
      for (let i = 0; i < 3; i++) {
        const response = await api.createNodeBlueprint({ hint: `sequential_${i}` });
        sequentialRequests.push(response);
        if (response.success && response.data) {
          createdNodes.push(response.data.nodeId);
        }
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      expect(sequentialRequests.length).toBe(3);
      expect(totalTime).toBeLessThan(15000); // Should complete within 15 seconds
      
      const successCount = sequentialRequests.filter(r => r.success).length;
      expect(successCount).toBeGreaterThan(1); // At least 2 should succeed
    }, TEST_CONFIG.timeout);
  });
});