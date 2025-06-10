/**
 * Quick API Test - Smaller scale test for faster validation
 * Tests the NodeBlueprintAPI with 50 nodes to verify everything works
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NodeBlueprintAPI } from '$lib/services/NodeBlueprintAPI.js';
import { getAuth, signInAnonymously, type User } from 'firebase/auth';
import { app } from '../firebase/index.js';

// Quick test configuration
const QUICK_CONFIG = {
  totalNodes: 50,
  batchSize: 10,
  searchTerms: ['calculator', 'processor', 'filter', 'test'],
  timeout: 60000 // 1 minute
};

// Test data
const testHints = ['calculator', 'processor', 'filter', 'converter', 'analyzer'];
const testTitles = ['Math Calculator', 'Text Processor', 'Data Filter', 'Format Converter', 'Pattern Analyzer'];
const testCodes = [
  'const result = inputs.a + inputs.b; outputs.set("result", result);',
  'const text = inputs.text.toUpperCase(); outputs.set("text", text);',
  'const filtered = inputs.data.filter(x => x > 0); outputs.set("data", filtered);',
  'const converted = JSON.stringify(inputs.obj); outputs.set("json", converted);',
  'const pattern = /\\d+/g.test(inputs.text); outputs.set("hasNumbers", pattern);'
];

const getRandomItem = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

describe('NodeBlueprintAPI - Quick Test Suite', () => {
  let api: NodeBlueprintAPI;
  let testUser: User;
  let createdNodes: Array<{ nodeId: string, nodeKey: string, hint: string }> = [];

  beforeAll(async () => {
    console.log('🚀 Starting Quick API Test...');
    
    // Initialize API
    api = new NodeBlueprintAPI();
    
    // Sign in anonymously for testing
    const auth = getAuth(app);
    const userCredential = await signInAnonymously(auth);
    testUser = userCredential.user;
    
    console.log(`🔐 Signed in as test user: ${testUser.uid}`);
  }, QUICK_CONFIG.timeout);

  afterAll(async () => {
    console.log(`✅ Quick test completed. Created ${createdNodes.length} test nodes.`);
  });

  describe('Basic Functionality', () => {
    it('should be properly authenticated', () => {
      expect(api.isAuthenticated()).toBe(true);
      expect(api.getCurrentUser()).toBeTruthy();
      expect(api.getCurrentUser()?.uid).toBe(testUser.uid);
    });

    it(`should create ${QUICK_CONFIG.totalNodes} random nodes`, async () => {
      console.log(`\n🔨 Creating ${QUICK_CONFIG.totalNodes} random nodes...`);
      
      const nodePromises = [];
      for (let i = 0; i < QUICK_CONFIG.totalNodes; i++) {
        const hint = getRandomItem(testHints);
        const promise = api.createNodeBlueprint({ hint: `${hint}_${i}` })
          .then(result => {
            if (result.success && result.data) {
              return {
                nodeId: result.data.nodeId,
                nodeKey: result.data.nodeId.split('/')[0],
                hint
              };
            }
            throw new Error(result.error || 'Failed to create node');
          });
        nodePromises.push(promise);
      }

      const results = await Promise.allSettled(nodePromises);
      createdNodes = results
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result => result.value);
      
      expect(createdNodes.length).toBeGreaterThan(QUICK_CONFIG.totalNodes * 0.9); // 90% success rate
      console.log(`✅ Successfully created ${createdNodes.length} nodes`);
    }, QUICK_CONFIG.timeout);

    it('should update documentation for all nodes', async () => {
      console.log('\n📝 Updating documentation...');
      
      const updatePromises = createdNodes.map((node, index) => {
        return api.updateNodeBlueprintDocs({
          nodeId: node.nodeId,
          title: `${getRandomItem(testTitles)} ${index}`,
          docs: `Auto-generated documentation for ${node.hint} node ${index}`
        });
      });

      const results = await Promise.allSettled(updatePromises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      
      expect(successful).toBeGreaterThan(createdNodes.length * 0.9); // 90% success rate
      console.log(`✅ Successfully updated documentation for ${successful} nodes`);
    }, QUICK_CONFIG.timeout);

    it('should update code for all nodes', async () => {
      console.log('\n💻 Updating code...');
      
      const updatePromises = createdNodes.map(node => {
        return api.updateNodeBlueprintSpec({
          nodeId: node.nodeId,
          newCode: getRandomItem(testCodes)
        });
      });

      const results = await Promise.allSettled(updatePromises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      
      expect(successful).toBeGreaterThan(createdNodes.length * 0.9); // 90% success rate
      console.log(`✅ Successfully updated code for ${successful} nodes`);
    }, QUICK_CONFIG.timeout);
  });

  describe('Advanced Operations', () => {
    it('should deploy 15 random nodes', async () => {
      console.log('\n🚀 Deploying nodes...');
      
      // Select 15 random nodes to deploy
      const nodesToDeploy = [];
      for (let i = 0; i < 15 && i < createdNodes.length; i++) {
        nodesToDeploy.push(createdNodes[Math.floor(Math.random() * createdNodes.length)]);
      }

      const deployPromises = nodesToDeploy.map(node => {
        return api.deployNodeBlueprint({ nodeId: node.nodeId });
      });

      const results = await Promise.allSettled(deployPromises);
      const successful = results.filter(r => 
        r.status === 'fulfilled' && r.value.success
      ).length;
      
      expect(successful).toBeGreaterThan(10); // At least 10 should succeed
      console.log(`✅ Successfully deployed ${successful} nodes`);
    }, QUICK_CONFIG.timeout);

    it('should fork 20 random nodes', async () => {
      console.log('\n🍴 Forking nodes...');
      
      const nodesToFork = [];
      for (let i = 0; i < 20 && i < createdNodes.length; i++) {
        nodesToFork.push(createdNodes[Math.floor(Math.random() * createdNodes.length)]);
      }

      const forkPromises = nodesToFork.map(node => {
        return api.forkNodeBlueprint({ nodeId: node.nodeId });
      });

      const results = await Promise.allSettled(forkPromises);
      const successful = results.filter(r => 
        r.status === 'fulfilled' && r.value.success
      ).length;
      
      expect(successful).toBeGreaterThan(15); // At least 15 should succeed
      console.log(`✅ Successfully forked ${successful} nodes`);
    }, QUICK_CONFIG.timeout);

    it('should search for nodes with various terms', async () => {
      console.log('\n🔍 Searching for nodes...');
      
      const searchPromises = QUICK_CONFIG.searchTerms.map(term => {
        return api.searchNodeBlueprintsByText({
          substring: term,
          includeDeployed: true
        }).then(result => ({ 
          term, 
          count: result.success ? result.data!.results.length : 0,
          success: result.success 
        }));
      });

      const searchResults = await Promise.all(searchPromises);
      
      searchResults.forEach(result => {
        console.log(`  🔍 "${result.term}": ${result.count} results`);
      });

      const successfulSearches = searchResults.filter(r => r.success).length;
      expect(successfulSearches).toBe(QUICK_CONFIG.searchTerms.length);
      console.log(`✅ Successfully completed ${successfulSearches} searches`);
    }, QUICK_CONFIG.timeout);
  });

  describe('Data Integrity & Performance', () => {
    it('should verify random sampling of created nodes', async () => {
      console.log('\n✅ Verifying node integrity...');
      
      // Test 10 random nodes
      const sampleSize = Math.min(10, createdNodes.length);
      const samplePromises = [];
      
      for (let i = 0; i < sampleSize; i++) {
        const randomNode = createdNodes[Math.floor(Math.random() * createdNodes.length)];
        samplePromises.push(
          api.getNodeBlueprint({ nodeId: randomNode.nodeId })
            .then(result => ({ 
              nodeId: randomNode.nodeId, 
              success: result.success && !!result.data 
            }))
        );
      }

      const samples = await Promise.all(samplePromises);
      const successCount = samples.filter(s => s.success).length;
      
      console.log(`✅ Successfully verified ${successCount}/${sampleSize} random nodes`);
      expect(successCount).toBeGreaterThan(sampleSize * 0.8); // 80% success rate
    }, QUICK_CONFIG.timeout);

    it('should handle concurrent operations', async () => {
      console.log('\n⚡ Testing concurrent operations...');
      
      const concurrentTasks = [
        // Create 3 new nodes
        ...Array.from({ length: 3 }, (_, i) => 
          api.createNodeBlueprint({ hint: `concurrent_${i}` })
        ),
        // Search 3 times
        ...Array.from({ length: 3 }, (_, i) => 
          api.searchNodeBlueprintsByText({ 
            substring: QUICK_CONFIG.searchTerms[i % QUICK_CONFIG.searchTerms.length],
            includeDeployed: true 
          })
        ),
        // Get 3 random nodes
        ...Array.from({ length: 3 }, () => {
          if (createdNodes.length > 0) {
            const randomNode = createdNodes[Math.floor(Math.random() * createdNodes.length)];
            return api.getNodeBlueprint({ nodeId: randomNode.nodeId });
          }
          return Promise.resolve({ success: true });
        })
      ];

      const startTime = Date.now();
      const results = await Promise.allSettled(concurrentTasks);
      const endTime = Date.now();

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const totalTime = endTime - startTime;

      console.log(`📊 Concurrent operations: ${concurrentTasks.length}`);
      console.log(`📊 Successful: ${successful}`);
      console.log(`📊 Total time: ${totalTime}ms`);
      console.log(`📊 Average time per operation: ${(totalTime / concurrentTasks.length).toFixed(2)}ms`);

      expect(successful).toBeGreaterThan(concurrentTasks.length * 0.8); // 80% success rate
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
    }, QUICK_CONFIG.timeout);

    it('should test error handling with invalid requests', async () => {
      console.log('\n🚨 Testing error handling...');
      
      // Test invalid node ID
      const invalidNodeResponse = await api.getNodeBlueprint({ 
        nodeId: 'invalid_node_id' 
      });
      expect(invalidNodeResponse.success).toBeDefined(); // Should handle gracefully
      
      // Test empty search
      const emptySearchResponse = await api.searchNodeBlueprintsByText({
        substring: 'nonexistentstring12345'
      });
      expect(emptySearchResponse.success).toBe(true);
      expect(emptySearchResponse.data!.results).toHaveLength(0);
      
      // Test short search term
      const shortSearchResponse = await api.searchNodeBlueprintsByText({
        substring: 'a'
      });
      expect(shortSearchResponse.success).toBe(false);
      expect(shortSearchResponse.error).toContain('at least 2 characters');
      
      console.log('✅ Error handling tests passed');
    }, QUICK_CONFIG.timeout);
  });

  describe('Performance Metrics', () => {
    it('should provide performance summary', async () => {
      console.log('\n📊 Performance Summary:');
      console.log(`  Total test nodes created: ${createdNodes.length}`);
      console.log(`  Test completion rate: ${((createdNodes.length / QUICK_CONFIG.totalNodes) * 100).toFixed(1)}%`);
      
      // Test response time with a few operations
      const startTime = Date.now();
      const testOperations = [
        api.createNodeBlueprint({ hint: 'perf_test' }),
        api.searchNodeBlueprintsByText({ substring: 'test', includeDeployed: true })
      ];
      
      await Promise.all(testOperations);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`  Average response time: ${(responseTime / testOperations.length).toFixed(2)}ms`);
      
      expect(responseTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(createdNodes.length).toBeGreaterThan(40); // Should create most nodes successfully
    }, QUICK_CONFIG.timeout);
  });
});