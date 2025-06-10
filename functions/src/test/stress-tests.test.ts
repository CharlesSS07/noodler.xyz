/**
 * Stress Test Suite for Node Blueprint API
 * Tests performance and reliability with large datasets
 */

import { describe, it } from 'mocha';
const { expect } = require('chai');
import fetch from 'node-fetch';

const FUNCTIONS_BASE_URL = 'http://127.0.0.1:5001/chuck-65c6e/us-central1';

// Test configuration
const STRESS_TEST_CONFIG = {
  totalNodes: 1000,
  batchSize: 50,
  forksPerNode: 3,
  deploymentsPercentage: 0.3, // 30% of nodes will be deployed
  searchTerms: [
    'calculator', 'processor', 'filter', 'converter', 'analyzer',
    'generator', 'validator', 'transformer', 'optimizer', 'scanner'
  ]
};

// Random data generators
const randomHints = [
  'math_operation', 'text_processor', 'image_filter', 'data_converter',
  'signal_analyzer', 'pattern_matcher', 'code_generator', 'file_reader',
  'network_scanner', 'crypto_hasher', 'json_parser', 'xml_validator',
  'email_sender', 'database_query', 'api_client', 'logger_utility'
];

const randomTitles = [
  'Advanced Calculator', 'Text Processor Pro', 'Image Enhancement Filter',
  'Data Format Converter', 'Signal Pattern Analyzer', 'Smart Validator',
  'Code Generator 3000', 'Universal File Reader', 'Network Security Scanner',
  'Crypto Hash Generator', 'JSON Data Parser', 'XML Schema Validator',
  'Email Notification Service', 'Database Query Builder', 'REST API Client',
  'System Event Logger', 'Machine Learning Predictor', 'Weather Data Fetcher'
];

const randomCodeSnippets = [
  `
    const input1 = inputs.input1 || 0;
    const input2 = inputs.input2 || 0;
    const result = input1 + input2;
    outputs.set('result', result);
  `,
  `
    const text = inputs.text || '';
    const processed = text.toUpperCase().trim();
    outputs.set('processed', processed);
  `,
  `
    const data = inputs.data || [];
    const filtered = data.filter(item => item.active === true);
    outputs.set('filtered', filtered);
  `,
  `
    const url = inputs.url || '';
    const response = await fetch(url);
    const json = await response.json();
    outputs.set('data', json);
  `,
  `
    const array = inputs.array || [];
    const sum = array.reduce((a, b) => a + b, 0);
    const avg = sum / array.length;
    outputs.set('average', avg);
  `,
  `
    const password = inputs.password || '';
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    outputs.set('hash', hash);
  `,
  `
    const email = inputs.email || '';
    const isValid = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
    outputs.set('valid', isValid);
  `,
  `
    const date = new Date();
    const timestamp = date.getTime();
    const formatted = date.toISOString();
    outputs.set('timestamp', timestamp);
    outputs.set('formatted', formatted);
  `
];

// Helper to create proper Firebase callable function payload (for authenticated calls)
const createAuthenticatedPayload = (data: any, uid: string = 'stress-test-user') => ({
  data,
  auth: {
    uid,
    token: {
      iss: 'firebase-adminsdk-test',
      aud: 'chuck-65c6e',
      auth_time: Math.floor(Date.now() / 1000),
      user_id: uid,
      sub: uid,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      firebase: {
        identities: {},
        sign_in_provider: 'custom'
      }
    }
  }
});

// Helper to call Firebase Functions with authentication
const callFunction = async (functionName: string, data: any, uid?: string) => {
  const payload = createAuthenticatedPayload(data, uid);

  const response = await fetch(`${FUNCTIONS_BASE_URL}/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${functionName} failed (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  return result.result; // Extract the result property
};

// Random data generators
const getRandomItem = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

const generateRandomNode = (index: number) => ({
  hint: getRandomItem(randomHints),
  title: `${getRandomItem(randomTitles)} ${index}`,
  docs: `This is auto-generated documentation for test node ${index}. ` +
        `It performs ${getRandomItem(['calculation', 'processing', 'filtering', 'analysis'])} ` +
        `operations on input data.`,
  code: getRandomItem(randomCodeSnippets)
});

// Utility functions
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const processBatch = async <T, R>(
  items: T[],
  batchSize: number,
  processor: (item: T, index: number) => Promise<R>,
  delayMs: number = 10
): Promise<R[]> => {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(items.length / batchSize)}`);
    
    const batchPromises = batch.map((item, batchIndex) => 
      processor(item, i + batchIndex)
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Small delay between batches to avoid overwhelming the system
    if (delayMs > 0 && i + batchSize < items.length) {
      await sleep(delayMs);
    }
  }
  
  return results;
};

describe('Node Blueprint API - Stress Tests', function() {
  // Increase timeout for stress tests
  this.timeout(300000); // 5 minutes

  let createdNodes: Array<{ nodeId: string, nodeKey: string, data: any }> = [];
  let deployedNodes: Array<{ nodeId: string, nodeKey: string }> = [];
  let forkedNodes: Array<{ nodeId: string, originalNodeId: string }> = [];

  describe('Mass Node Creation', () => {
    it(`should create ${STRESS_TEST_CONFIG.totalNodes} nodes in batches`, async () => {
      console.log(`\n🚀 Creating ${STRESS_TEST_CONFIG.totalNodes} random nodes...`);
      
      const nodeSpecs = Array.from({ length: STRESS_TEST_CONFIG.totalNodes }, (_, i) => 
        generateRandomNode(i + 1)
      );

      const createNode = async (nodeSpec: any, index: number) => {
        try {
          // Create node
          const createResult = await callFunction('createNodeBlueprint', {
            hint: nodeSpec.hint
          }, `user-${Math.floor(index / 100)}`); // Distribute across multiple users
          
          // Update documentation
          await callFunction('updateNodeBlueprintDocs', {
            nodeId: createResult.nodeId,
            title: nodeSpec.title,
            docs: nodeSpec.docs
          }, `user-${Math.floor(index / 100)}`);
          
          // Update code
          await callFunction('updateNodeBlueprintSpec', {
            nodeId: createResult.nodeId,
            newCode: nodeSpec.code
          }, `user-${Math.floor(index / 100)}`);
          
          return {
            nodeId: createResult.nodeId,
            nodeKey: createResult.nodeId.split('/')[0],
            data: nodeSpec
          };
        } catch (error) {
          console.error(`Failed to create node ${index}:`, error.message);
          throw error;
        }
      };

      createdNodes = await processBatch(
        nodeSpecs,
        STRESS_TEST_CONFIG.batchSize,
        createNode,
        50 // 50ms delay between batches
      );

      expect(createdNodes).to.have.length(STRESS_TEST_CONFIG.totalNodes);
      console.log(`✅ Successfully created ${createdNodes.length} nodes`);
    });

    it('should verify random sampling of created nodes', async () => {
      // Test a random sample of 10 nodes
      const sampleSize = Math.min(10, createdNodes.length);
      const sampleIndices = Array.from({ length: sampleSize }, () => 
        Math.floor(Math.random() * createdNodes.length)
      );

      for (const index of sampleIndices) {
        const node = createdNodes[index];
        const retrieved = await callFunction('getNodeBlueprint', { nodeId: node.nodeId });
        
        expect(retrieved).to.not.be.null;
        expect(retrieved.node_key).to.equal(node.nodeKey);
        expect(retrieved.title).to.equal(node.data.title);
        expect(retrieved.documentation).to.equal(node.data.docs);
        expect(retrieved.user_defined_code_snippet.trim()).to.equal(node.data.code.trim());
      }

      console.log(`✅ Verified ${sampleSize} randomly sampled nodes`);
    });
  });

  describe('Mass Deployment', () => {
    it('should deploy a percentage of created nodes', async () => {
      const nodesToDeploy = createdNodes.slice(0, 
        Math.floor(createdNodes.length * STRESS_TEST_CONFIG.deploymentsPercentage)
      );

      console.log(`\n🚀 Deploying ${nodesToDeploy.length} nodes...`);

      const deployNode = async (node: any, index: number) => {
        try {
          // Extract user ID from node ID for proper authentication
          const userMatch = node.nodeId.match(/versions\/([^:]+):/);
          const userId = userMatch ? userMatch[1] : 'stress-test-user';
          
          await callFunction('deployNodeBlueprint', {
            nodeId: node.nodeId
          }, userId);
          
          return {
            nodeId: node.nodeId,
            nodeKey: node.nodeKey
          };
        } catch (error) {
          console.error(`Failed to deploy node ${index}:`, error.message);
          throw error;
        }
      };

      deployedNodes = await processBatch(
        nodesToDeploy,
        Math.floor(STRESS_TEST_CONFIG.batchSize / 2), // Smaller batches for deployments
        deployNode,
        100 // 100ms delay between batches
      );

      expect(deployedNodes).to.have.length(nodesToDeploy.length);
      console.log(`✅ Successfully deployed ${deployedNodes.length} nodes`);
    });

    it('should verify deployed nodes are read-only', async () => {
      // Test a few deployed nodes to ensure they're read-only
      const sampleSize = Math.min(5, deployedNodes.length);
      
      for (let i = 0; i < sampleSize; i++) {
        const node = deployedNodes[i];
        
        try {
          // Extract user ID from node ID
          const userMatch = node.nodeId.match(/versions\/([^:]+):/);
          const userId = userMatch ? userMatch[1] : 'stress-test-user';
          
          await callFunction('updateNodeBlueprintSpec', {
            nodeId: node.nodeId,
            newCode: 'console.log("should fail");'
          }, userId);
          
          expect.fail('Should not be able to update deployed node');
        } catch (error) {
          expect(error.message).to.include('Cannot update deployed node');
        }
      }

      console.log(`✅ Verified ${sampleSize} deployed nodes are read-only`);
    });
  });

  describe('Mass Forking', () => {
    it('should fork nodes multiple times each', async () => {
      // Fork a subset of nodes multiple times
      const nodesToFork = createdNodes.slice(0, Math.min(100, createdNodes.length));
      const forkTasks: Array<{ originalNode: any, forkIndex: number }> = [];

      // Create fork tasks
      for (const node of nodesToFork) {
        for (let i = 0; i < STRESS_TEST_CONFIG.forksPerNode; i++) {
          forkTasks.push({ originalNode: node, forkIndex: i });
        }
      }

      console.log(`\n🚀 Creating ${forkTasks.length} forks from ${nodesToFork.length} nodes...`);

      const forkNode = async (task: any, index: number) => {
        try {
          const result = await callFunction('forkNodeBlueprint', {
            nodeId: task.originalNode.nodeId
          }, `fork-user-${Math.floor(index / 50)}`); // Different user for forks
          
          return {
            nodeId: result.nodeId,
            originalNodeId: task.originalNode.nodeId
          };
        } catch (error) {
          console.error(`Failed to fork node ${index}:`, error.message);
          throw error;
        }
      };

      forkedNodes = await processBatch(
        forkTasks,
        STRESS_TEST_CONFIG.batchSize,
        forkNode,
        30 // 30ms delay between batches
      );

      expect(forkedNodes).to.have.length(forkTasks.length);
      console.log(`✅ Successfully created ${forkedNodes.length} forks`);
    });

    it('should verify fork relationships', async () => {
      // Test a sample of forks
      const sampleSize = Math.min(10, forkedNodes.length);
      
      for (let i = 0; i < sampleSize; i++) {
        const fork = forkedNodes[i];
        const forkData = await callFunction('getNodeBlueprint', { nodeId: fork.nodeId });
        
        expect(forkData).to.not.be.null;
        expect(forkData.predecessor_nid).to.equal(fork.originalNodeId);
        expect(forkData.title).to.include('Fork of');
        expect(forkData.is_deployed).to.be.false;
        expect(forkData.trust_level).to.equal('New');
      }

      console.log(`✅ Verified ${sampleSize} fork relationships`);
    });
  });

  describe('Mass Search Operations', () => {
    it('should perform searches with known substrings', async () => {
      console.log(`\n🔍 Performing search tests with known terms...`);
      
      const searchResults: Array<{ term: string, count: number, time: number }> = [];

      for (const term of STRESS_TEST_CONFIG.searchTerms) {
        const startTime = Date.now();
        
        const result = await callFunction('searchNodeBlueprintsByText', {
          substring: term,
          includeDeployed: true
        });
        
        const endTime = Date.now();
        const searchTime = endTime - startTime;
        
        searchResults.push({
          term,
          count: result.results.length,
          time: searchTime
        });

        console.log(`  🔍 "${term}": ${result.results.length} results (${searchTime}ms)`);
      }

      // Verify that searches return reasonable results
      const totalSearches = searchResults.length;
      const searchesWithResults = searchResults.filter(r => r.count > 0).length;
      const averageSearchTime = searchResults.reduce((sum, r) => sum + r.time, 0) / totalSearches;

      console.log(`\n📊 Search Statistics:`);
      console.log(`  Total searches: ${totalSearches}`);
      console.log(`  Searches with results: ${searchesWithResults}`);
      console.log(`  Average search time: ${averageSearchTime.toFixed(2)}ms`);

      expect(averageSearchTime).to.be.lessThan(2000); // Should be under 2 seconds
      expect(searchesWithResults).to.be.greaterThan(0); // At least some searches should return results
    });

    it('should perform partial string searches', async () => {
      // Test searches with partial strings from our created nodes
      const partialTerms = ['calc', 'proc', 'filt', 'conv', 'test'];
      
      for (const term of partialTerms) {
        const result = await callFunction('searchNodeBlueprintsByText', {
          substring: term,
          includeDeployed: true
        });
        
        expect(result).to.have.property('results');
        expect(result.results).to.be.an('array');
        console.log(`  🔍 "${term}": ${result.results.length} results`);
      }
    });

    it('should handle case-insensitive searches', async () => {
      const testCases = [
        { lower: 'calculator', upper: 'CALCULATOR' },
        { lower: 'processor', upper: 'PROCESSOR' },
        { lower: 'filter', upper: 'FILTER' }
      ];

      for (const testCase of testCases) {
        const lowerResult = await callFunction('searchNodeBlueprintsByText', {
          substring: testCase.lower,
          includeDeployed: true
        });
        
        const upperResult = await callFunction('searchNodeBlueprintsByText', {
          substring: testCase.upper,
          includeDeployed: true
        });

        // Results should be similar (allowing for some variation due to timing)
        expect(Math.abs(lowerResult.results.length - upperResult.results.length)).to.be.lessThan(5);
      }
    });
  });

  describe('Performance Analysis', () => {
    it('should analyze overall system performance', async () => {
      console.log(`\n📊 Performance Analysis Summary:`);
      console.log(`  Total nodes created: ${createdNodes.length}`);
      console.log(`  Total nodes deployed: ${deployedNodes.length}`);
      console.log(`  Total forks created: ${forkedNodes.length}`);
      
      const totalOperations = createdNodes.length + deployedNodes.length + forkedNodes.length;
      console.log(`  Total operations: ${totalOperations}`);

      // Verify data integrity with random sampling
      const sampleSize = Math.min(20, createdNodes.length);
      console.log(`\n🔍 Performing data integrity check on ${sampleSize} random nodes...`);
      
      let successfulReads = 0;
      for (let i = 0; i < sampleSize; i++) {
        const randomNode = createdNodes[Math.floor(Math.random() * createdNodes.length)];
        try {
          const retrieved = await callFunction('getNodeBlueprint', { nodeId: randomNode.nodeId });
          if (retrieved && retrieved.node_key === randomNode.nodeKey) {
            successfulReads++;
          }
        } catch (error) {
          console.error(`Failed to read node ${randomNode.nodeId}:`, error.message);
        }
      }

      const integrityRate = (successfulReads / sampleSize) * 100;
      console.log(`  Data integrity rate: ${integrityRate.toFixed(1)}%`);
      
      expect(integrityRate).to.be.greaterThan(95); // 95% integrity threshold
    });

    it('should test concurrent operations', async () => {
      console.log(`\n⚡ Testing concurrent operations...`);
      
      // Perform multiple different operations concurrently
      const concurrentTasks = [
        // Create some new nodes
        ...Array.from({ length: 5 }, (_, i) => 
          callFunction('createNodeBlueprint', { hint: `concurrent_test_${i}` }, 'concurrent-user')
        ),
        // Search operations
        ...Array.from({ length: 3 }, (_, i) => 
          callFunction('searchNodeBlueprintsByText', { 
            substring: STRESS_TEST_CONFIG.searchTerms[i % STRESS_TEST_CONFIG.searchTerms.length],
            includeDeployed: true 
          })
        ),
        // Get operations
        ...Array.from({ length: 5 }, () => {
          const randomNode = createdNodes[Math.floor(Math.random() * createdNodes.length)];
          return callFunction('getNodeBlueprint', { nodeId: randomNode.nodeId });
        })
      ];

      const startTime = Date.now();
      const results = await Promise.allSettled(concurrentTasks);
      const endTime = Date.now();

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      const totalTime = endTime - startTime;

      console.log(`  Concurrent operations: ${concurrentTasks.length}`);
      console.log(`  Successful: ${successful}`);
      console.log(`  Failed: ${failed}`);
      console.log(`  Total time: ${totalTime}ms`);
      console.log(`  Average time per operation: ${(totalTime / concurrentTasks.length).toFixed(2)}ms`);

      expect(successful).to.be.greaterThan(concurrentTasks.length * 0.8); // 80% success rate
    });
  });
});